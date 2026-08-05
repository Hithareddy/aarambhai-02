"""
AI assessment report service.

Turns a completed placement session into a rich, learner-facing report:
skill matrix (LSRW + vocabulary, grammar, pronunciation, confidence),
CEFR-style level, AI insights, and personalized recommendations where every
recommendation carries the reason it was selected.

Reads existing data only — it does not create new tables or duplicate the
AssessmentService result pipeline; it enriches it.
"""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import (
    AssessmentBlueprint,
    AssessmentResult,
    AssessmentSession,
    QuestionResponse,
)
from app.models.question import Question
from app.services.learner_service import LearnerService
from app.services.persona_blueprint_service import (
    PersonaBlueprintService,
    build_persona_spec,
)

REPORT_SKILLS = [
    "listening",
    "speaking",
    "reading",
    "writing",
    "vocabulary",
    "grammar",
    "pronunciation",
    "everyday_communication",
]

CEFR_BANDS = [
    (0.00, "Pre-A1", "Starting out"),
    (0.20, "A1", "Beginner"),
    (0.40, "A2", "Elementary"),
    (0.60, "B1", "Intermediate"),
    (0.80, "B2", "Upper intermediate"),
    (0.92, "C1", "Advanced"),
]

# Persona-aware recommendation catalogue. Kept small and declarative so the
# existing Learning Path / Practice / Games / Resources modules stay the owners
# of the actual content — this only points at them, with a reason.
SKILL_LESSONS: dict[str, dict[str, str]] = {
    "listening": {"module_id": "listen_conversations", "title": "Everyday Conversations (Listening)"},
    "speaking": {"module_id": "speak_greetings", "title": "Greetings and Introductions"},
    "reading": {"module_id": "read_sentences", "title": "Reading Simple Sentences"},
    "writing": {"module_id": "write_sentences", "title": "Sentence Building"},
    "vocabulary": {"module_id": "vocab_basics", "title": "Vocabulary Basics"},
    "grammar": {"module_id": "grammar_nouns", "title": "Introduction to Nouns"},
    "pronunciation": {"module_id": "speak_greetings", "title": "Sound and Pronunciation Practice"},
    "everyday_communication": {"module_id": "listen_conversations", "title": "Real-Life Conversations"},
}

SKILL_GAMES: dict[str, dict[str, str]] = {
    "listening": {"id": "listen-choose", "title": "Listen & Choose"},
    "speaking": {"id": "flashcards", "title": "Speak the Flashcard"},
    "reading": {"id": "word-match", "title": "Word Match"},
    "writing": {"id": "sentence-builder", "title": "Sentence Builder"},
    "vocabulary": {"id": "four-pics-one-word", "title": "Four Pics One Word"},
    "grammar": {"id": "sentence-builder", "title": "Sentence Builder"},
    "pronunciation": {"id": "spelling-challenge", "title": "Spelling Challenge"},
    "everyday_communication": {"id": "picture-match", "title": "Picture Match"},
}

PERSONA_MISSIONS: dict[str, list[str]] = {
    "early_learner": [
        "Name five fruits at home out loud to a family member.",
        "Point at three colours you can see and say them in your learning language.",
    ],
    "school_student": [
        "Read one page of your textbook aloud today.",
        "Write three sentences about what happened at school.",
    ],
    "college_student": [
        "Introduce yourself in 60 seconds as if in an interview.",
        "Write a short email requesting a meeting with a professor.",
    ],
    "homemaker": [
        "Buy vegetables and ask the price in your learning language.",
        "Describe today's cooking in five sentences.",
    ],
    "professional": [
        "Give a two-minute update as if in a team meeting.",
        "Write a follow-up email to a customer.",
    ],
    "senior_citizen": [
        "Practise asking a pharmacist about medicine timing.",
        "Book a ticket or ask for directions out loud.",
    ],
    "general_adult": [
        "Have one short conversation in your learning language today.",
        "Describe your daily routine in five sentences.",
    ],
}

PERSONA_RESOURCES: dict[str, list[dict[str, str]]] = {
    "early_learner": [
        {"type": "worksheet", "title": "Picture & Word Worksheet", "reason": "Builds word–picture links without reading pressure."},
        {"type": "youtube", "title": "Learn Colours and Animals (Kids)", "query": "learn colours and animals for kids", "reason": "Short visual videos match your picture-first assessment."},
    ],
    "school_student": [
        {"type": "cheatsheet", "title": "Classroom Vocabulary Cheat Sheet", "reason": "Covers the school words you were unsure about."},
        {"type": "youtube", "title": "Simple English Stories for Students", "query": "simple english short stories for students", "reason": "Reinforces reading and listening together."},
    ],
    "college_student": [
        {"type": "cheatsheet", "title": "Interview Answer Framework", "reason": "You'll need structured spoken answers for placements."},
        {"type": "youtube", "title": "Group Discussion Techniques", "query": "group discussion techniques for students", "reason": "Matches the discussion scenarios in your assessment."},
    ],
    "homemaker": [
        {"type": "cheatsheet", "title": "Market & Shopping Phrases", "reason": "Daily-use phrases from the shopping questions you attempted."},
        {"type": "youtube", "title": "Everyday English for Home and Market", "query": "everyday english conversation shopping market", "reason": "Practical listening for the situations you face daily."},
    ],
    "professional": [
        {"type": "cheatsheet", "title": "Professional Email Templates", "reason": "Strengthens the written workplace skills we measured."},
        {"type": "youtube", "title": "Business Meeting English", "query": "business meeting english phrases", "reason": "Directly supports meeting and presentation confidence."},
    ],
    "senior_citizen": [
        {"type": "cheatsheet", "title": "Hospital & Bank Phrase Card", "reason": "Ready-to-use phrases for the places you visit most."},
        {"type": "youtube", "title": "Slow and Clear English Conversations", "query": "slow english conversation practice", "reason": "Slower audio matches your comfortable listening pace."},
    ],
    "general_adult": [
        {"type": "cheatsheet", "title": "Everyday Conversation Starters", "reason": "Quick wins for daily speaking practice."},
        {"type": "youtube", "title": "Daily English Conversation Practice", "query": "daily english conversation practice", "reason": "Broad practice across the skills we measured."},
    ],
}


def _cefr(score: float) -> tuple[str, str]:
    level, label = "Pre-A1", "Starting out"
    for threshold, code, name in CEFR_BANDS:
        if score >= threshold:
            level, label = code, name
    return level, label


def _band(score: float) -> str:
    if score >= 0.8:
        return "Advanced"
    if score >= 0.6:
        return "Intermediate"
    if score >= 0.4:
        return "Developing"
    if score >= 0.2:
        return "Beginner"
    return "Foundation"


class AssessmentReportService:
    """Builds the AI assessment report for a completed session."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def build_report(self, session_id: str, user_id: str | None = None) -> dict[str, Any]:
        query = select(AssessmentSession).where(AssessmentSession.id == session_id)
        if user_id is not None:
            query = query.where(AssessmentSession.learner_id == user_id)
        session = (await self.db.execute(query)).scalar_one_or_none()
        if session is None:
            raise ValueError("Assessment session not found")

        profile = await LearnerService(self.db).get_learner_profile_by_user_id(session.learner_id)
        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        spec = PersonaBlueprintService.spec_from_blueprint(blueprint)
        if spec is None and profile is not None:
            spec = build_persona_spec(profile)
        persona = (spec or {}).get("persona", "general_adult")

        rows = (
            await self.db.execute(
                select(QuestionResponse, Question)
                .join(Question, Question.id == QuestionResponse.question_id)
                .where(QuestionResponse.session_id == session.id)
                .order_by(QuestionResponse.created_at.asc())
            )
        ).all()

        stats = self._score(rows)
        overall = stats["overall"]
        cefr_code, cefr_label = _cefr(overall)

        skills = self._skill_matrix(stats)
        strengths = [s for s in skills if s["score"] >= 0.7][:3]
        weaknesses = sorted(
            [s for s in skills if s["asked"] > 0 and s["score"] < 0.6],
            key=lambda s: s["score"],
        )[:3]

        insights = self._insights(stats, strengths, weaknesses, spec or {}, profile)
        recommendations = self._recommendations(
            weaknesses, strengths, persona, overall, profile
        )

        stored = (
            await self.db.execute(
                select(AssessmentResult).where(AssessmentResult.session_id == session.id)
            )
        ).scalar_one_or_none()

        return {
            "session_id": str(session.id),
            "persona": persona,
            "persona_label": (spec or {}).get("label", "Everyday learner"),
            "completed_at": (session.end_time or session.start_time),
            "questions_answered": stats["total"],
            "overall_score": round(overall, 3),
            "overall_level": _band(overall),
            "cefr_level": cefr_code,
            "cefr_label": cefr_label,
            "confidence": round(stats["confidence"], 3),
            "readiness_level": "Ready" if overall >= 0.6 else "Needs Practice",
            "summary": self._summary(overall, strengths, weaknesses, spec or {}, profile),
            "skills": skills,
            "strengths": [s["skill"] for s in strengths],
            "weaknesses": [s["skill"] for s in weaknesses],
            "insights": insights,
            "recommendations": recommendations,
            "learning_path": json.loads(stored.learning_path) if stored and stored.learning_path else [],
        }

    # ------------------------------------------------------------------ #

    def _score(self, rows: list[Any]) -> dict[str, Any]:
        per_skill: dict[str, dict[str, float]] = {}
        total = 0
        weighted_correct = 0.0
        weighted_total = 0.0
        times: list[int] = []
        fast_wrong = 0
        slow_correct = 0
        mistakes: list[dict[str, Any]] = []
        types_wrong: dict[str, int] = {}
        media_correct = {"with": [0, 0], "without": [0, 0]}

        for response, question in rows:
            total += 1
            skill = (question.skill or "reading").strip().lower()
            weight = max(1, int(question.difficulty or 1))
            bucket = per_skill.setdefault(skill, {"correct": 0.0, "total": 0.0, "w_correct": 0.0, "w_total": 0.0})
            bucket["total"] += 1
            bucket["w_total"] += weight
            if response.is_correct:
                bucket["correct"] += 1
                bucket["w_correct"] += weight
                weighted_correct += weight
            weighted_total += weight

            rt = int(response.response_time_seconds or 0)
            times.append(rt)
            if response.is_correct and rt > 25:
                slow_correct += 1
            if not response.is_correct and rt < 5:
                fast_wrong += 1

            has_media = bool(question.image_url or question.audio_url or question.audio_script)
            key = "with" if has_media else "without"
            media_correct[key][1] += 1
            if response.is_correct:
                media_correct[key][0] += 1

            if not response.is_correct:
                qtype = (question.question_type or "mcq").strip().lower()
                types_wrong[qtype] = types_wrong.get(qtype, 0) + 1
                mistakes.append(
                    {
                        "skill": skill,
                        "question_type": qtype,
                        "domain": question.domain,
                        "difficulty": question.difficulty,
                    }
                )

        overall = (weighted_correct / weighted_total) if weighted_total else 0.0
        avg_time = (sum(times) / len(times)) if times else 0.0

        # Confidence blends accuracy with response decisiveness and hesitation.
        hesitation_penalty = min(0.25, (slow_correct / total) * 0.25) if total else 0.0
        guess_penalty = min(0.25, (fast_wrong / total) * 0.3) if total else 0.0
        confidence = max(0.0, min(1.0, overall * 0.85 + 0.15 - hesitation_penalty - guess_penalty))

        return {
            "per_skill": per_skill,
            "total": total,
            "overall": overall,
            "avg_time": avg_time,
            "fast_wrong": fast_wrong,
            "slow_correct": slow_correct,
            "mistakes": mistakes,
            "types_wrong": types_wrong,
            "confidence": confidence,
            "media": media_correct,
        }

    def _skill_matrix(self, stats: dict[str, Any]) -> list[dict[str, Any]]:
        per_skill = stats["per_skill"]
        matrix = []
        for skill in REPORT_SKILLS:
            bucket = per_skill.get(skill)
            if bucket and bucket["w_total"]:
                score = bucket["w_correct"] / bucket["w_total"]
                asked = int(bucket["total"])
            else:
                # Derive an estimate for skills not directly assessed so the
                # radar chart stays complete without inventing hard claims.
                score = stats["overall"] * 0.9
                asked = 0
            matrix.append(
                {
                    "skill": skill,
                    "score": round(score, 3),
                    "level": _band(score),
                    "asked": asked,
                    "measured": asked > 0,
                }
            )
        # Pronunciation mirrors speaking evidence when not separately assessed.
        speaking = next((s for s in matrix if s["skill"] == "speaking"), None)
        pron = next((s for s in matrix if s["skill"] == "pronunciation"), None)
        if speaking and pron and not pron["measured"] and speaking["measured"]:
            pron["score"] = round(speaking["score"] * 0.95, 3)
            pron["level"] = _band(pron["score"])
        return matrix

    def _summary(self, overall, strengths, weaknesses, spec, profile) -> str:
        name = getattr(profile, "name", None) or "Learner"
        persona_label = spec.get("label", "everyday learner")
        s_txt = ", ".join(s["skill"].replace("_", " ") for s in strengths)
        w_txt = ", ".join(w["skill"].replace("_", " ") for w in weaknesses)
        base = f"{name}, this assessment was built for you as a {persona_label.lower()}."
        if s_txt and w_txt:
            return f"{base} You are already comfortable with {s_txt}, and your fastest gains will come from {w_txt}."
        if s_txt:
            return f"{base} You are already comfortable with {s_txt}. We'll keep raising the challenge from here."
        if w_txt:
            return f"{base} We'll begin gently with {w_txt} and build confidence step by step."
        return f"{base} We've prepared a balanced starting plan for you."

    def _insights(self, stats, strengths, weaknesses, spec, profile) -> list[dict[str, str]]:
        insights: list[dict[str, str]] = []

        if strengths:
            insights.append({
                "type": "strength",
                "title": "Biggest strength",
                "detail": f"You handled {strengths[0]['skill'].replace('_', ' ')} questions confidently — "
                          f"{int(strengths[0]['score'] * 100)}% accuracy at your working difficulty.",
            })
        if weaknesses:
            insights.append({
                "type": "weakness",
                "title": "Priority improvement area",
                "detail": f"{weaknesses[0]['skill'].replace('_', ' ').title()} needs the most attention — "
                          f"we've placed it first in your learning path.",
            })

        types_wrong = stats["types_wrong"]
        if types_wrong:
            worst_type = max(types_wrong, key=types_wrong.get)
            insights.append({
                "type": "mistake",
                "title": "Common mistake pattern",
                "detail": f"Most slips happened on {worst_type.replace('_', ' ')} activities "
                          f"({types_wrong[worst_type]} times). We'll practise this format deliberately.",
            })

        with_media, without_media = stats["media"]["with"], stats["media"]["without"]
        style = "balanced"
        if with_media[1] and without_media[1]:
            wm = with_media[0] / with_media[1]
            wo = without_media[0] / without_media[1]
            if wm - wo > 0.15:
                style = "visual and audio"
            elif wo - wm > 0.15:
                style = "text-based"
        insights.append({
            "type": "style",
            "title": "Learning style signal",
            "detail": f"You performed best with {style} material, so your lessons will lead with that format.",
        })

        avg = stats["avg_time"]
        if stats["fast_wrong"] >= 2:
            conf = "You answered some questions very quickly and missed them — slowing down will lift your score fast."
        elif stats["slow_correct"] >= 2:
            conf = "You took your time and got them right. Accuracy is there; speed and confidence will follow with practice."
        else:
            conf = f"Your pacing was steady (about {int(avg)} seconds per question), a good sign of settled confidence."
        insights.append({"type": "confidence", "title": "Confidence observation", "detail": conf})

        return insights

    def _recommendations(self, weaknesses, strengths, persona, overall, profile) -> dict[str, Any]:
        focus = [w["skill"] for w in weaknesses] or [s["skill"] for s in strengths] or ["vocabulary"]
        primary = focus[0]

        daily_minutes = int(getattr(profile, "daily_goal_minutes", 0) or 0) or (
            10 if persona in ("early_learner", "senior_citizen") else 20
        )

        lessons = []
        for idx, skill in enumerate(focus[:3]):
            meta = SKILL_LESSONS.get(skill, {"module_id": f"core_{skill}", "title": f"{skill.title()} Fundamentals"})
            lessons.append({
                "module_id": meta["module_id"],
                "title": meta["title"],
                "skill": skill,
                "priority": idx + 1,
                "reason": f"Your {skill.replace('_', ' ')} score was the "
                          f"{'lowest' if idx == 0 else 'next lowest'} in this assessment.",
            })

        games = []
        for skill in focus[:2]:
            meta = SKILL_GAMES.get(skill)
            if meta:
                games.append({
                    **meta,
                    "skill": skill,
                    "reason": f"A light way to drill {skill.replace('_', ' ')} without it feeling like a test.",
                })

        practice = [{
            "skill": skill,
            "title": f"{skill.replace('_', ' ').title()} practice set",
            "reason": f"Short daily sets keep {skill.replace('_', ' ')} improving between lessons.",
        } for skill in focus[:3]]

        resources = PERSONA_RESOURCES.get(persona, PERSONA_RESOURCES["general_adult"])
        missions = [
            {"title": m, "reason": "A real-life task matched to where you actually use the language."}
            for m in PERSONA_MISSIONS.get(persona, PERSONA_MISSIONS["general_adult"])
        ]

        revision = [
            {"when": "Day 1", "focus": primary, "reason": "First recall while the lesson is fresh."},
            {"when": "Day 3", "focus": primary, "reason": "Spaced repetition to move it into long-term memory."},
            {"when": "Day 7", "focus": focus[1] if len(focus) > 1 else primary, "reason": "Weekly consolidation of your second priority."},
        ]

        return {
            "daily_goal": {
                "minutes": daily_minutes,
                "reason": "Matched to your onboarding pace so the habit is sustainable.",
            },
            "weekly_goal": {
                "lessons": 3 if overall < 0.6 else 5,
                "minutes": daily_minutes * 5,
                "reason": "Enough repetition to show measurable progress within a week.",
            },
            "lessons": lessons,
            "practice": practice,
            "games": games,
            "resources": resources,
            "missions": missions,
            "revision_schedule": revision,
            "tutor_objective": {
                "objective": f"Help me improve my {primary.replace('_', ' ')} for everyday situations.",
                "reason": "Your AI Tutor starts from your weakest measured skill so the first conversation is useful.",
            },
        }
