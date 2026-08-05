"""
Assessment service layer.

Handles business logic for assessment blueprint generation, session management,
and result calculation.
"""
import json
import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import (
    AssessmentBlueprint,
    AssessmentResult,
    AssessmentSession,
    QuestionResponse,
)
from app.models.question import Question
from app.schemas.assessment import (
    AssessmentBlueprintCreate,
    AssessmentSessionCreate,
    QuestionResponseCreate,
)
from app.services.learner_service import LearnerService

DEFAULT_BLUEPRINT_ID = "initial-adaptive"

# Configurable question counts per assessment type.
# Future assessment types (e.g. "practice", "unit-test") can define their own lengths.
QUESTION_COUNTS: dict[str, int] = {
    "initial-adaptive": 15,  # Primary placement assessment
}
DEFAULT_QUESTION_COUNT = QUESTION_COUNTS.get("initial-adaptive", 15)

# LSRW skills targeted for balanced coverage
LSRW_SKILLS = ["listening", "speaking", "reading", "writing"]


class AssessmentService:
    """Service for assessment business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_or_create_default_blueprint(self) -> AssessmentBlueprint:
        """Return the shared default placement blueprint, creating it if absent."""
        result = await self.db.execute(
            select(AssessmentBlueprint).where(
                AssessmentBlueprint.id == DEFAULT_BLUEPRINT_ID
            )
        )
        blueprint = result.scalar_one_or_none()
        if blueprint is not None:
            return blueprint

        blueprint = AssessmentBlueprint(
            id=DEFAULT_BLUEPRINT_ID,
            learning_goal="Initial placement",
            question_count=DEFAULT_QUESTION_COUNT,
            min_difficulty=1,
            max_difficulty=5,
            estimated_duration_minutes=5,
            domains=self._to_json(
                ["Reading", "Grammar", "Vocabulary", "Listening", "Speaking", "Writing"]
            ),
            skills=self._to_json(
                ["reading", "grammar", "vocabulary", "listening", "speaking", "writing"]
            ),
            question_distribution=self._to_json({}),
        )
        self.db.add(blueprint)
        await self.db.commit()
        await self.db.refresh(blueprint)
        return blueprint

    @staticmethod
    def _to_json(value) -> str:
        """Serialize answer payloads for Text-backed JSON columns."""
        return json.dumps(value, ensure_ascii=False)

    @staticmethod
    def _from_json(value: str):
        """Deserialize Text-backed JSON values."""
        return json.loads(value)

    @staticmethod
    def _clamp_difficulty(difficulty: int) -> int:
        """Keep adaptive difficulty inside the supported range."""
        return max(1, min(5, difficulty))

    @staticmethod
    def shuffle_options_for_session(
        session_id: str,
        question_id: str,
        options: list[Any],
        correct_answer: Any,
        question_type: str = ""
    ) -> tuple[list[dict], Any]:
        """
        Shuffles options for option-based assessment questions deterministically per session and question.
        Re-labels option IDs to 'A', 'B', 'C', 'D'... and updates effective correct answer.
        Preserves correct answer mapping and returns (shuffled_options, effective_correct_answer).
        """
        if (
            not options
            or not isinstance(options, list)
            or len(options) < 2
            or question_type in ["speaking", "arrange"]
        ):
            return options, correct_answer

        norm_options = []
        for idx, opt in enumerate(options):
            if isinstance(opt, dict):
                orig_id = str(opt.get("id") or str(idx))
                orig_text = str(opt.get("text") or opt.get("label") or opt.get("value") or "")
                opt_copy = dict(opt)
            else:
                orig_id = str(idx)
                orig_text = str(opt)
                opt_copy = {"id": orig_id, "text": orig_text}
            
            opt_copy["_orig_id"] = orig_id
            opt_copy["_orig_text"] = orig_text
            opt_copy["_orig_idx"] = idx
            norm_options.append(opt_copy)

        def _is_correct(opt_dict: dict, corr_ans: Any) -> bool:
            if corr_ans is None:
                return False
            
            if isinstance(corr_ans, str):
                try:
                    corr_ans = json.loads(corr_ans)
                except Exception:
                    pass
            
            orig_id = opt_dict["_orig_id"].strip().lower()
            orig_text = opt_dict["_orig_text"].strip().lower()
            orig_idx = opt_dict["_orig_idx"]

            if isinstance(corr_ans, list):
                norm_list = [str(x).strip().lower() for x in corr_ans]
                return orig_id in norm_list or orig_text in norm_list or str(orig_idx) in norm_list

            corr_str = str(corr_ans).strip().lower()
            
            if orig_id == corr_str or orig_text == corr_str or str(orig_idx) == corr_str:
                return True
            
            if corr_str in ["a", "b", "c", "d"] and orig_id in ["a", "b", "c", "d"]:
                corr_idx = ord(corr_str) - ord("a")
                if orig_idx == corr_idx:
                    return True

            return False

        for opt in norm_options:
            opt["_is_correct"] = _is_correct(opt, correct_answer)

        seed_str = f"assessment_shuffle:{session_id}:{question_id}"
        rng = random.Random(seed_str)
        
        shuffled = list(norm_options)
        rng.shuffle(shuffled)

        new_options = []
        effective_correct_ids = []

        for i, opt in enumerate(shuffled):
            new_id = chr(65 + i)
            clean_opt = {k: v for k, v in opt.items() if not k.startswith("_")}
            clean_opt["id"] = new_id
            new_options.append(clean_opt)

            if opt.get("_is_correct"):
                effective_correct_ids.append(new_id)

        if len(effective_correct_ids) == 1:
            effective_correct = effective_correct_ids[0]
        elif len(effective_correct_ids) > 1:
            effective_correct = effective_correct_ids
        else:
            effective_correct = correct_answer

        return new_options, effective_correct

    def serialize_question_for_assessment(
        self, question: Question, is_fallback: bool | None = None
    ) -> dict:
        """Convert a Question ORM object into QuestionForAssessment shape."""
        qc = self._from_json(question.question_content)
        stimulus = None
        if isinstance(qc, dict):
            stimulus = qc.get("stimulus") or qc.get("passage") or qc.get("scenario")
        if not stimulus:
            stimulus = question.reference_text

        return {
            "id": str(question.id),
            "learning_goal": question.learning_goal,
            "domain": question.domain,
            "skill": question.skill,
            "difficulty": question.difficulty,
            "question_type": question.question_type,
            "language": question.language,
            "question_content": qc,
            "stimulus": stimulus,
            "options": self._from_json(question.options),
            "is_fallback": is_fallback,
            "audio_url": question.audio_url,
            "audio_script": question.audio_script,
            "image_url": question.image_url,
            "reference_text": question.reference_text,
            "max_duration_seconds": question.max_duration_seconds,
            "language_code": question.language_code,
        }

    async def _get_translated_question(
        self, question: Question, website_lang: str, learning_lang: str
    ) -> tuple[dict, bool]:
        """
        Retrieves translation for a logical Question row:
        - website_lang controls UI/support/instruction language (question_content).
        - learning_lang controls target language being learned (options).
        Falls back to default base English version if translation is missing.
        """
        website_lang = (website_lang or "en").strip().lower()
        learning_lang = (learning_lang or "en").strip().lower()
        
        # Serialize base English version of the Question
        serialized = self.serialize_question_for_assessment(question, is_fallback=False)
        from app.models.translation import ContentTranslation

        # 1. Translate UI/Instruction prompt if website_lang != "en"
        if website_lang != "en":
            res_ui = await self.db.execute(
                select(ContentTranslation).where(
                    ContentTranslation.entity_type == "question",
                    ContentTranslation.entity_id == str(question.id),
                    ContentTranslation.language_code == website_lang
                )
            )
            ui_trans = res_ui.scalar_one_or_none()
            if ui_trans:
                fields = self._from_json(ui_trans.translated_fields)
                existing_qc = serialized.get("question_content")
                if isinstance(existing_qc, dict):
                    updated_qc = dict(existing_qc)
                else:
                    updated_qc = {"text": str(existing_qc)} if existing_qc else {}

                if "question_text" in fields and fields["question_text"]:
                    updated_qc["text"] = fields["question_text"]
                    updated_qc["instruction"] = fields["question_text"]
                elif "question_content" in fields and fields["question_content"]:
                    q_content = fields["question_content"]
                    if isinstance(q_content, dict):
                        updated_qc.update(q_content)
                    elif isinstance(q_content, str):
                        updated_qc["text"] = q_content

                serialized["question_content"] = updated_qc

        # 2. Translate options / choices if learning_lang != "en"
        if learning_lang != "en":
            res_target = await self.db.execute(
                select(ContentTranslation).where(
                    ContentTranslation.entity_type == "question",
                    ContentTranslation.entity_id == str(question.id),
                    ContentTranslation.language_code == learning_lang
                )
            )
            target_trans = res_target.scalar_one_or_none()
            if target_trans:
                fields = self._from_json(target_trans.translated_fields)
                if "options" in fields and fields["options"]:
                    serialized["options"] = fields["options"]
                elif "option_a" in fields and fields["option_a"]:
                    serialized["options"] = [
                        {"id": "A", "text": fields["option_a"]},
                        {"id": "B", "text": fields["option_b"]},
                        {"id": "C", "text": fields["option_c"]},
                        {"id": "D", "text": fields["option_d"]}
                    ]

        serialized["language"] = learning_lang
        return serialized, False

    async def _get_active_session(
        self, session_id: str, user_id: str | None = None
    ) -> AssessmentSession:
        query = select(AssessmentSession).where(AssessmentSession.id == session_id)
        if user_id is not None:
            query = query.where(AssessmentSession.learner_id == user_id)

        result = await self.db.execute(query)
        session = result.scalar_one_or_none()
        if session is None:
            raise ValueError("Assessment session not found")
        if session.status != "in_progress":
            raise ValueError("Assessment session is not in progress")
        return session

    def _serialize_result(self, result: "AssessmentResult") -> dict[str, Any]:
        """Convert an AssessmentResult ORM row into the API response shape."""
        return {
            "id": result.id,
            "session_id": result.session_id,
            "learner_id": result.learner_id,
            "overall_proficiency": result.overall_proficiency,
            "confidence_score": result.confidence_score,
            "readiness_level": result.readiness_level,
            "skill_proficiencies": self._from_json(result.skill_proficiencies),
            "strengths": self._from_json(result.strengths),
            "weaknesses": self._from_json(result.weaknesses),
            "learning_summary": result.learning_summary,
            "learning_path": self._from_json(result.learning_path),
            "assessment_version": result.assessment_version,
            "created_at": result.created_at,
        }

    async def serialize_session(self, session: AssessmentSession) -> dict[str, Any]:
        """Return client-safe session state with the blueprint's actual length."""
        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        return {
            "id": str(session.id),
            "learner_id": str(session.learner_id),
            "blueprint_id": str(session.blueprint_id),
            "status": session.status,
            "current_question_index": session.current_question_index,
            "current_difficulty": session.current_difficulty,
            "total_questions": blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "created_at": session.created_at,
        }

    async def _get_active_question(self, question_id: str) -> Question:
        result = await self.db.execute(
            select(Question).where(Question.id == question_id, Question.is_active.is_(True))
        )
        question = result.scalar_one_or_none()
        if question is None:
            raise ValueError("Question not found")
        return question

    async def generate_blueprint(
        self, blueprint_data: AssessmentBlueprintCreate, user_id: str
    ) -> AssessmentBlueprint:
        """Generate assessment blueprint based on learner profile."""
        analysis = await LearnerService(self.db).analyze_profile(user_id)
        
        blueprint = AssessmentBlueprint(
            learning_goal=blueprint_data.learning_goal,
            question_count=analysis["question_count"],
            min_difficulty=analysis["min_difficulty"],
            max_difficulty=analysis["max_difficulty"],
            estimated_duration_minutes=analysis["estimated_duration_minutes"],
            domains=self._to_json(analysis["priority_domains"]),
            skills=self._to_json(analysis["priority_skills"]),
            question_distribution=self._to_json(blueprint_data.question_distribution or {}),
        )
        self.db.add(blueprint)
        await self.db.commit()
        await self.db.refresh(blueprint)
        return blueprint

    async def create_session(
        self, session_data: AssessmentSessionCreate, user_id: str
    ) -> AssessmentSession:
        """Create assessment session using placement blueprint."""
        if session_data.blueprint_id:
            result = await self.db.execute(
                select(AssessmentBlueprint).where(
                    AssessmentBlueprint.id == session_data.blueprint_id
                )
            )
            blueprint = result.scalar_one_or_none()
            if blueprint is None:
                raise ValueError("Assessment blueprint not found")
        else:
            # Persona-driven blueprint: flow, sequence, formats, difficulty band
            # and scoring are derived from the learner's onboarding profile.
            from app.services.persona_blueprint_service import PersonaBlueprintService

            profile = await LearnerService(self.db).get_learner_profile_by_user_id(user_id)
            if profile is not None:
                blueprint = await PersonaBlueprintService(self.db).get_or_create_blueprint(profile)
            else:
                blueprint = await self._get_or_create_default_blueprint()

        starting_difficulty = await self.get_initial_difficulty_for_user(user_id, blueprint)

        session = AssessmentSession(
            learner_id=user_id,
            blueprint_id=blueprint.id,
            status="in_progress",
            current_question_index=0,
            current_difficulty=starting_difficulty,
            start_time=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: str, user_id: str | None = None) -> dict[str, Any]:
        """Return a persisted session owned by the requesting learner."""
        query = select(AssessmentSession).where(AssessmentSession.id == session_id)
        if user_id is not None:
            query = query.where(AssessmentSession.learner_id == user_id)
        result = await self.db.execute(query)
        session = result.scalar_one_or_none()
        if session is None:
            raise ValueError("Assessment session not found")
        return await self.serialize_session(session)

    async def get_initial_difficulty_for_user(
        self, user_id: str, blueprint: AssessmentBlueprint | None = None
    ) -> int:
        """Profile-aware initial difficulty mapping from learner's current_familiarity."""
        profile = await LearnerService(self.db).get_learner_profile_by_user_id(user_id)
        if profile is None:
            return 1

        familiarity = (profile.current_familiarity or "").strip().lower()
        if "advanced" in familiarity:
            level = 4
        elif "intermediate" in familiarity or "comfortable" in familiarity:
            level = 3
        elif "elementary" in familiarity or "little" in familiarity:
            level = 2
        else:
            level = 1

        min_diff = blueprint.min_difficulty if blueprint else 1
        max_diff = blueprint.max_difficulty if blueprint else 5
        return max(min_diff, min(max_diff, level))

    @staticmethod
    def is_question_profile_eligible(question: Question, profile: Any) -> bool:
        """
        Enforce strict 10-Criteria Learner Personalization Filter.
        Ensures questions match learner age, role, education, learning_language, and familiarity.
        """
        if not profile:
            return True

        role = (profile.current_role or "").strip().lower()
        age = (profile.age_group or "").strip().lower()
        edu = (profile.educational_background or profile.education_level or "").strip().lower()
        goal = (profile.learning_goal or "").strip().lower()
        target_lang = (profile.learning_language or "en").strip().lower()
        familiarity = (profile.current_familiarity or "").strip().lower()
        
        domain = (question.domain or question.topic_category or "").strip().lower()
        q_lang = (question.language or question.language_code or "en").strip().lower()
        
        # 1. QUESTION STATUS: Must be active
        if not question.is_active:
            return False

        # 2. QUESTION COMPLETENESS: Must have valid question_content and options (or reference text for speaking)
        if not question.question_content or (question.question_type != "speaking" and not question.options):
            return False

        # 3. LEARNING LANGUAGE FILTER
        target_lang_code = "te" if "telugu" in target_lang or target_lang == "te" else "hi" if "hindi" in target_lang or target_lang == "hi" else "en"
        q_lang_code = "te" if "telugu" in q_lang or q_lang == "te" else "hi" if "hindi" in q_lang or q_lang == "hi" else "en"

        if target_lang_code != "en" and q_lang_code != target_lang_code and q_lang_code != "en":
            return False

        # Parse tags
        tags = []
        if question.tags:
            try:
                tags = json.loads(question.tags) if isinstance(question.tags, str) else question.tags
            except Exception:
                tags = []

        role_tags = [t.lower() for t in (json.loads(question.learner_type) if question.learner_type and question.learner_type.startswith('[') else tags)]
        age_tags = [t.lower() for t in (json.loads(question.age_group) if question.age_group and question.age_group.startswith('[') else tags)]

        is_child = "under 12" in age or "<12" in age or "child" in age
        is_teen = "12" in age or "13" in age or "17" in age
        is_student = "student" in role or is_child or is_teen or "primary" in edu or "secondary" in edu
        is_professional = "professional" in role or "working" in role or "corporate" in role
        is_senior = "senior" in role or "60+" in age or "60" in age
        is_homemaker = "homemaker" in role

        # 4. AGE GROUP & SCENARIO BOUNDARIES
        if is_child:
            # Under 12 children MUST NOT receive adult/corporate/medical/financial scenarios!
            forbidden_domains = [
                "healthcare", "doctor_appointment", "clinic", "workplace", "corporate",
                "office", "atm", "banking", "investment", "government_forms", "medicine_label"
            ]
            if domain in forbidden_domains:
                return False
            
            # Check for adult prompt content
            qc_str = (question.question_content or "").lower()
            if any(term in qc_str for term in ["appointment", "doctor", "hospital", "clinic", "salary", "colleague", "corporate", "investment", "bank"]):
                return False

            # Require child-friendly role or age tags if tags exist
            if age_tags and not any("under 12" in t or "student" in t for t in age_tags):
                return False

        if is_student and domain in ["workplace", "corporate"]:
            return False
        if is_homemaker and domain in ["workplace", "corporate", "school_campus"]:
            return False
        if is_senior and domain in ["workplace", "corporate", "school_campus"]:
            return False

        # 5. EDUCATION LEVEL & FAMILIARITY BOUNDARIES
        if ("primary" in edu or is_child or "beginner" in familiarity) and question.difficulty > 3:
            return False

        return True

    async def get_next_question(self, session_id: str, user_id: str | None = None) -> dict:
        """Get next question using profile-aware, context-diversified, 3-3-3-3-3 skill ratio adaptive engine."""
        session = await self._get_active_session(session_id, user_id)
        
        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        question_count = blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT

        current_session_count = await self.db.scalar(
            select(func.count(QuestionResponse.id)).where(QuestionResponse.session_id == session_id)
        )
        current_session_count = current_session_count or 0

        if current_session_count >= question_count:
            raise ValueError("No more questions available")

        profile = await LearnerService(self.db).get_learner_profile_by_user_id(session.learner_id)
        website_language = (profile.website_language or "en").strip().lower() if profile else "en"
        learning_language = (profile.learning_language or "en").strip().lower() if profile else "en"

        # Persona spec drives skill mix, formats, contexts and difficulty band.
        from app.services.persona_blueprint_service import (
            PersonaBlueprintService,
            build_persona_spec,
        )

        spec = PersonaBlueprintService.spec_from_blueprint(blueprint)
        if spec is None and profile is not None:
            spec = build_persona_spec(profile)

        skill_mix: dict[str, int] = dict(spec["skill_mix"]) if spec else {
            "listening": 3,
            "speaking": 3,
            "reading": 3,
            "writing": 3,
            "everyday_communication": 3,
        }
        preferred_types = [t.lower() for t in (spec.get("preferred_types") if spec else []) or []]
        avoid_types = {t.lower() for t in (spec.get("avoid_types") if spec else []) or []}
        persona_domains = [d.lower() for d in (spec.get("domains") if spec else []) or []]
        forbidden_domains = {d.lower() for d in (spec.get("forbidden_domains") if spec else []) or []}
        persona_min_diff = int(spec["min_difficulty"]) if spec else 1
        persona_max_diff = int(spec["max_difficulty"]) if spec else 5

        TARGET_SKILLS = list(skill_mix.keys())

        # Calculate current answered skill counts in this session
        answered_res = await self.db.execute(
            select(
                Question.skill,
                Question.domain,
                Question.question_type,
                Question.question_content,
                Question.audio_script,
                Question.id,
                QuestionResponse.is_correct,
                QuestionResponse.created_at,
            )
            .join(QuestionResponse, QuestionResponse.question_id == Question.id)
            .where(QuestionResponse.session_id == session_id)
            .order_by(QuestionResponse.created_at.asc())
        )
        answered_rows = answered_res.fetchall()

        skill_counts = {s: 0 for s in TARGET_SKILLS}
        used_contexts = []
        used_types = []
        used_prompts = set()
        used_ids = set()
        recent_wrong_types: list[str] = []
        trailing_wrong = 0

        for s_skill, s_domain, s_type, s_content, s_audio, s_id, s_correct, _created in answered_rows:
            if s_skill in skill_counts:
                skill_counts[s_skill] += 1
            if s_domain:
                used_contexts.append(s_domain)
            if s_type:
                used_types.append(s_type)
            used_ids.add(s_id)
            if s_content:
                try:
                    qc = json.loads(s_content)
                    if qc.get("prompt"):
                        used_prompts.add(qc.get("prompt"))
                except Exception:
                    pass
            if s_correct:
                trailing_wrong = 0
            else:
                trailing_wrong += 1
                if s_type:
                    recent_wrong_types.append(s_type.lower())

        # Repeated mistakes → switch the interaction format instead of
        # hammering the learner with the same one.
        struggling = trailing_wrong >= 2
        blocked_types = set(recent_wrong_types[-2:]) if struggling else set()

        # Determine eligible target skills for the next slot from the persona mix
        eligible_skills = [s for s in TARGET_SKILLS if skill_counts.get(s, 0) < skill_mix[s]]
        if not eligible_skills:
            eligible_skills = TARGET_SKILLS

        # Keep the persona's skill distribution balanced as the session runs
        min_ratio = min(skill_counts.get(s, 0) / max(1, skill_mix[s]) for s in eligible_skills)
        preferred_skills = [
            s for s in eligible_skills
            if skill_counts.get(s, 0) / max(1, skill_mix[s]) <= min_ratio + 0.001
        ]

        # Fetch active candidate questions
        base_stmt = select(Question).where(
            Question.is_active.is_(True),
            Question.id.notin_(used_ids)
        )
        res_cand = await self.db.execute(base_stmt)
        all_candidates = res_cand.scalars().all()

        # Filter candidates for strict profile eligibility
        eligible_candidates = [q for q in all_candidates if self.is_question_profile_eligible(q, profile)]

        # Persona hard boundaries: forbidden contexts and banned formats
        if forbidden_domains:
            eligible_candidates = [
                q for q in eligible_candidates
                if (q.domain or "").strip().lower() not in forbidden_domains
            ] or eligible_candidates
        if avoid_types:
            filtered = [
                q for q in eligible_candidates
                if (q.question_type or "").strip().lower() not in avoid_types
            ]
            if filtered:
                eligible_candidates = filtered

        if not eligible_candidates:
            # Strictly enforce profile boundaries: never serve healthcare/workplace to children under 12
            is_child_profile = profile and ("under 12" in (profile.age_group or "").lower() or "<12" in (profile.age_group or "").lower())
            eligible_candidates = [
                q for q in all_candidates
                if q.is_active and not (is_child_profile and q.domain in ["healthcare", "workplace", "atm", "investment"])
            ]
        if not eligible_candidates:
            eligible_candidates = all_candidates

        # Filter candidates by skill preference
        skill_candidates = [q for q in eligible_candidates if q.skill in preferred_skills]
        if not skill_candidates:
            skill_candidates = [q for q in eligible_candidates if q.skill in eligible_skills]
        if not skill_candidates:
            skill_candidates = eligible_candidates

        # Score candidates for persona fit, context diversity, format diversity,
        # non-repetition, and adaptive difficulty alignment.
        best_question = None
        best_score = -999999

        # Never overwhelm a struggling beginner: cap the target difficulty.
        target_difficulty = self._clamp_difficulty(session.current_difficulty)
        target_difficulty = max(persona_min_diff, min(persona_max_diff, target_difficulty))
        if struggling:
            target_difficulty = max(persona_min_diff, target_difficulty - 1)

        import random
        for q in skill_candidates:
            qc = {}
            if q.question_content:
                try:
                    qc = json.loads(q.question_content)
                except Exception:
                    pass

            # Exclude prompt duplicates
            prompt_text = qc.get("prompt") or qc.get("instruction") or ""
            if prompt_text in used_prompts:
                continue

            q_type = (q.question_type or "").strip().lower()
            score = 0.0

            # Difficulty proximity to the adaptive target
            diff_diff = abs(q.difficulty - target_difficulty)
            score -= (diff_diff * 100)

            # Persona format fit: earlier in preferred_types = better
            if preferred_types:
                if q_type in preferred_types:
                    score += (len(preferred_types) - preferred_types.index(q_type)) * 25
                else:
                    score -= 60

            # Persona context fit: real-life situations written for this learner
            ctx = (q.domain or "").strip().lower()
            if persona_domains and ctx in persona_domains:
                score += 70

            # Repeated mistakes → avoid repeating the same failing format
            if q_type in blocked_types:
                score -= 200

            # Context diversity: penalize if context repeated frequently
            ctx_count = used_contexts.count(q.domain or "")
            score -= (ctx_count * 50)

            # Format diversity: penalize if type repeated frequently
            type_count = used_types.count(q.question_type or "")
            score -= (type_count * 30)

            # Media-first personas prefer questions carrying image/audio
            if spec and spec.get("media_required") and (q.image_url or q.audio_url or q.audio_script):
                score += 40

            # Random tie-breaker
            score += random.random() * 5

            if score > best_score:
                best_score = score
                best_question = q

        if best_question is None:
            # Fallback if strict prompt exclusion left no candidates
            best_question = skill_candidates[0] if skill_candidates else all_candidates[0]

        # Translate instruction for website_language and options for learning_language
        translated_dict, _ = await self._get_translated_question(best_question, website_language, learning_language)
        
        # Shuffle answer options deterministically for this session and question
        shuffled_options, _ = self.shuffle_options_for_session(
            session_id=session.id,
            question_id=best_question.id,
            options=translated_dict.get("options") or [],
            correct_answer=best_question.correct_answer,
            question_type=best_question.question_type or ""
        )
        translated_dict["options"] = shuffled_options
        return translated_dict

    def _evaluate_speaking_rubric(self, question: Question, selected: Any) -> bool:
        """
        Phase D Multi-tiered Speaking Rubric:
        - Level 1: reward attempt (non-empty response, valid recording/text).
        - Level 2: attempt + intelligibility (minimum 2 words / non-trivial length).
        - Level 3: keywords + pronunciation (presence of expected keywords/reference text words).
        - Level 4: grammar + fluency + pronunciation (keyword coverage ratio >= 40%).
        - Level 5: communicative effectiveness (keyword coverage ratio >= 60%).
        """
        if selected is None:
            return False

        spoken_text = ""
        if isinstance(selected, dict):
            spoken_text = selected.get("transcript") or selected.get("text") or selected.get("selected_option") or ""
        elif isinstance(selected, str):
            if '"status":"spoken"' in selected.replace(" ", ""):
                try:
                    obj = json.loads(selected)
                    spoken_text = obj.get("selected_option") or obj.get("transcript") or selected
                except Exception:
                    spoken_text = selected
            else:
                spoken_text = selected

        spoken_text = str(spoken_text).strip()
        if not spoken_text or spoken_text.lower() in ["error", "skipped", "silent", "none"]:
            return False

        diff = question.difficulty or 1
        ref_text = (question.reference_text or question.audio_script or "").strip().lower()
        exp_keywords = []
        if question.expected_keywords:
            try:
                exp_keywords = json.loads(question.expected_keywords) if isinstance(question.expected_keywords, str) else question.expected_keywords
            except Exception:
                exp_keywords = []

        if not exp_keywords and ref_text:
            exp_keywords = [w.strip(".,!?:;\"'") for w in ref_text.split() if len(w) > 2]

        words = [w.strip(".,!?:;\"'").lower() for w in spoken_text.split()]

        # Level 1: reward attempt
        if diff <= 1:
            return len(spoken_text) > 0

        # Level 2: attempt + intelligibility
        if diff == 2:
            return len(words) >= 1 or len(spoken_text) >= 3

        # Level 3: keywords + pronunciation
        if diff == 3:
            if not exp_keywords:
                return len(words) >= 2
            matched = any(kw.lower() in spoken_text.lower() for kw in exp_keywords)
            return matched or len(words) >= 3

        # Level 4: grammar + fluency + pronunciation
        if diff == 4:
            if not exp_keywords:
                return len(words) >= 3
            matches = sum(1 for kw in exp_keywords if kw.lower() in spoken_text.lower())
            ratio = matches / len(exp_keywords) if exp_keywords else 1.0
            return ratio >= 0.4 or len(words) >= 4

        # Level 5: communicative effectiveness
        if not exp_keywords:
            return len(words) >= 4
        matches = sum(1 for kw in exp_keywords if kw.lower() in spoken_text.lower())
        ratio = matches / len(exp_keywords) if exp_keywords else 1.0
        return ratio >= 0.6 or len(words) >= 5

    def _evaluate_correctness(self, question: Question, selected: Any, correct: Any, options: list[Any] | None = None) -> bool:
        """
        Evaluate correctness of selected_answer against correct_answer with robust type normalizations
        and Phase D multi-tiered speaking rubric.
        """
        if selected is None:
            return False

        if question.question_type == "speaking" or question.skill == "speaking":
            return self._evaluate_speaking_rubric(question, selected)

        if correct is None:
            return False

        # If it's a JSON-like string (like spoken object), parse it first
        if isinstance(selected, str) and '"status":"spoken"' in selected.replace(" ", ""):
            try:
                spoken_object = json.loads(selected)
                selected = spoken_object.get("selected_option", selected)
            except json.JSONDecodeError:
                pass

        # Normalize comparison
        def normalize_val(val: Any) -> str:
            if isinstance(val, list):
                # Join list elements, trimmed and lowercase
                return ",".join(str(x).strip().lower() for x in val)
            return str(val).strip().lower()

        # Direct exact match first
        if selected == correct:
            return True

        # Normalized comparison
        if normalize_val(selected) == normalize_val(correct):
            return True

        # Also check if selected matches text of option whose ID is correct
        if options and isinstance(options, list):
            norm_selected = normalize_val(selected)
            norm_correct = normalize_val(correct)
            for opt in options:
                if isinstance(opt, dict):
                    opt_id = normalize_val(opt.get("id"))
                    opt_text = normalize_val(opt.get("text") or opt.get("label") or "")
                    if opt_id == norm_correct and opt_text == norm_selected:
                        return True

        return False

    async def submit_response(
        self, session_id: str, response_data: QuestionResponseCreate, user_id: str | None = None
    ) -> QuestionResponse:
        """
        Submit question response and update session state with smooth Phase E adaptive engine.
        """
        session = await self._get_active_session(session_id, user_id)
        question = await self._get_active_question(response_data.question_id)

        existing_response = await self.db.scalar(
            select(func.count(QuestionResponse.id)).where(
                QuestionResponse.session_id == session.id,
                QuestionResponse.question_id == question.id,
            )
        )
        if existing_response:
            raise ValueError("This question has already been answered in this session")

        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        question_count = blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT
        response_count = await self.db.scalar(
            select(func.count(QuestionResponse.id)).where(
                QuestionResponse.session_id == session.id
            )
        )
        if (response_count or 0) >= question_count:
            raise ValueError("Assessment already has all required responses")

        # Determine target language from learner profile to support translated correct answer overrides
        profile = await LearnerService(self.db).get_learner_profile_by_user_id(session.learner_id)
        target_language = (profile.learning_language or "en").strip().lower() if profile else "en"
        
        correct_answer_str = question.correct_answer
        trans_fields = None
        if target_language != "en":
            from app.models.translation import ContentTranslation
            trans_result = await self.db.execute(
                select(ContentTranslation.translated_fields).where(
                    ContentTranslation.entity_type == "question",
                    ContentTranslation.entity_id == str(question.id),
                    ContentTranslation.language_code == target_language
                )
            )
            trans_fields = trans_result.scalar_one_or_none()
            if trans_fields:
                fields = self._from_json(trans_fields)
                if "correct_answer" in fields:
                    correct_answer_str = self._to_json(fields["correct_answer"])

        correct_answer = self._from_json(correct_answer_str)
        selected_answer = response_data.selected_answer

        raw_options = self._from_json(question.options)
        if target_language != "en" and trans_fields:
            fields = self._from_json(trans_fields)
            if "options" in fields and fields["options"]:
                raw_options = fields["options"]

        shuffled_options, effective_correct_answer = self.shuffle_options_for_session(
            session_id=session.id,
            question_id=question.id,
            options=raw_options,
            correct_answer=correct_answer,
            question_type=question.question_type or ""
        )
        
        # Calculate correctness using effective correct answer and shuffled options
        is_correct = self._evaluate_correctness(question, selected_answer, effective_correct_answer, shuffled_options)

        response = QuestionResponse(
            session_id=session.id,
            question_id=question.id,
            selected_answer=self._to_json(selected_answer),
            is_correct=is_correct,
            response_time_seconds=response_data.response_time_seconds,
            difficulty_at_response=session.current_difficulty,
        )

        # Phase E: Smooth adaptive progression with streak bonus
        previous_responses = (await self.db.execute(
            select(QuestionResponse)
            .where(QuestionResponse.session_id == session.id)
            .order_by(QuestionResponse.created_at.desc())
        )).scalars().all()

        consecutive_correct = 0
        for r in previous_responses:
            if r.is_correct:
                consecutive_correct += 1
            else:
                break

        session.current_question_index += 1
        if is_correct:
            # Single correct answer steps +1 level
            # Rapid response (<5s) WITH consecutive correct streak (>=2) steps +1 bonus (total +2)
            is_rapid = bool(response_data.response_time_seconds and response_data.response_time_seconds < 5)
            step = 2 if (is_rapid and consecutive_correct >= 2) else 1
            next_difficulty = session.current_difficulty + step
        else:
            # Single incorrect answer steps -1 level
            next_difficulty = session.current_difficulty - 1

        session.current_difficulty = self._clamp_difficulty(next_difficulty)

        self.db.add(response)
        await self.db.commit()
        await self.db.refresh(response)
        await self.db.refresh(session)

        # Pre-fetch next question to eliminate additional network round-trips
        next_q_data = None
        try:
            next_q_data = await self.get_next_question(session_id=session.id, user_id=session.learner_id)
        except Exception:
            next_q_data = None

        return {
            "id": str(response.id),
            "session_id": str(response.session_id),
            "question_id": str(response.question_id),
            "response_time_seconds": response.response_time_seconds,
            "difficulty_at_response": response.difficulty_at_response,
            "created_at": response.created_at,
            "is_correct": is_correct,
            "next_question": next_q_data
        }

    def _calculate_overall_level(self, accuracy: float, responses: list[QuestionResponse]) -> str:
        """
        Determine the overall level based on deterministic thresholds.
        Structured to easily allow incorporating difficulty reached, consistency, etc.
        """
        # Thresholds:
        # <20% = Foundation
        # 20–39% = Beginner
        # 40–59% = Developing
        # 60–79% = Intermediate
        # 80%+ = Advanced
        if accuracy < 0.2:
            return "Foundation"
        elif accuracy < 0.4:
            return "Beginner"
        elif accuracy < 0.6:
            return "Developing"
        elif accuracy < 0.8:
            return "Intermediate"
        else:
            return "Advanced"

    async def complete_assessment(self, session_id: str, user_id: str | None = None) -> dict[str, Any]:
        """
        Complete assessment and generate results.

        Args:
            session_id: Session ID
            user_id: User ID (optional)

        Returns:
            Complete assessment results (serialized)

        Raises:
            ValueError: If session not found or cannot be completed
        """
        # Load the session without requiring it to be in progress so that a
        # repeated completion request is idempotent (returns the stored result).
        session_query = select(AssessmentSession).where(AssessmentSession.id == session_id)
        if user_id is not None:
            session_query = session_query.where(AssessmentSession.learner_id == user_id)
        session_result = await self.db.execute(session_query)
        session = session_result.scalar_one_or_none()
        if session is None:
            raise ValueError("Assessment session not found")

        if session.status == "completed":
            existing = await self.get_assessment_result(session_id, user_id)
            if existing is not None:
                return existing

        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        expected_response_count = blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT

        # Get all responses for this session
        responses_result = await self.db.execute(
            select(QuestionResponse).where(QuestionResponse.session_id == session_id)
        )
        responses = responses_result.scalars().all()

        if len(responses) < expected_response_count:
            raise ValueError(
                f"Assessment is incomplete: {len(responses)} of {expected_response_count} responses recorded"
            )

        # Calculate statistics
        total_questions = len(responses)
        correct_answers = sum(1 for r in responses if r.is_correct)
        accuracy = (correct_answers / total_questions) if total_questions > 0 else 0.0

        # Calculate skill-wise scores
        skill_scores = {}
        for response in responses:
            question = await self._get_active_question(response.question_id)
            skill = question.skill
            if skill not in skill_scores:
                skill_scores[skill] = {"correct": 0, "total": 0}
            skill_scores[skill]["total"] += 1
            if response.is_correct:
                skill_scores[skill]["correct"] += 1

        # Calculate skill proficiency percentages
        skill_proficiencies = []
        for skill, data in skill_scores.items():
            proficiency = (data["correct"] / data["total"]) if data["total"] > 0 else 0.0
            skill_proficiencies.append({
                "skill": skill,
                "proficiency": proficiency,
                "questions_asked": data["total"]
            })

        # Determine overall proficiency
        overall_proficiency = self._calculate_overall_level(accuracy, responses)

        # Determine strengths and weaknesses based on real skill proficiencies
        strengths = [str(s["skill"]) for s in skill_proficiencies if float(s["proficiency"]) >= 0.7]
        weaknesses = [str(s["skill"]) for s in skill_proficiencies if float(s["proficiency"]) < 0.5]

        # Generate programmatic Learning Summary
        if strengths and weaknesses:
            learning_summary = f"You are comfortable with {', '.join(strengths)}. Focus on {', '.join(weaknesses)}. Your personalized lessons will begin with these skills."
        elif strengths:
            learning_summary = f"Great job! You are comfortable with {', '.join(strengths)}. Let's continue building on this foundation."
        elif weaknesses:
            learning_summary = f"Welcome! We'll start by focusing on {', '.join(weaknesses)}. Your personalized lessons are tailored to help you improve here."
        else:
             learning_summary = "Welcome to Aarambh! We have designed a balanced set of modules to get you started."

        # Map weaknesses to specific lesson modules and prioritize them
        data_driven_path = []
        priority_counter = 1
        
        # Helper mapping for basic skills pointing to the new Sprint 9 Curriculum entry nodes
        module_mapping = {
            "vocabulary": {"module_id": "vocab_basics", "title": "Vocabulary Basics"},
            "grammar": {"module_id": "grammar_nouns", "title": "Introduction to Nouns"},
            "reading": {"module_id": "read_sentences", "title": "Reading Simple Sentences"},
            "listening": {"module_id": "listen_conversations", "title": "Everyday Conversations (Listening)"},
            "speaking": {"module_id": "speak_greetings", "title": "Greetings and Introductions"},
            "writing": {"module_id": "write_sentences", "title": "Sentence Building"},
        }
        
        # 2. Prioritize weaknesses
        for w in weaknesses:
             mod = module_mapping.get(w.lower(), {"module_id": f"core_{w.lower()}", "title": f"{w.title()} Fundamentals"})
             data_driven_path.append({
                 "module_id": mod["module_id"],
                 "title": mod["title"],
                 "skill": w,
                 "priority": priority_counter
             })
             priority_counter += 1
             
        # 2. Add remaining skills as follow-ups
        for s in [score["skill"] for score in skill_proficiencies if score["skill"] not in weaknesses]:
             s_str = str(s)
             mod = module_mapping.get(s_str.lower(), {"module_id": f"core_{s_str.lower()}", "title": f"{s_str.title()} Fundamentals"})
             data_driven_path.append({
                 "module_id": mod["module_id"],
                 "title": mod["title"],
                 "skill": s_str,
                 "priority": priority_counter
             })
             priority_counter += 1

        # Update session status
        session.status = "completed"
        session.end_time = datetime.now(timezone.utc).replace(tzinfo=None)

        # Create result
        result = AssessmentResult(
            session_id=session.id,
            learner_id=session.learner_id,
            overall_proficiency=overall_proficiency,
            confidence_score=accuracy,
            readiness_level="Ready" if accuracy >= 0.6 else "Needs Practice",
            skill_proficiencies=self._to_json(skill_proficiencies),
            strengths=self._to_json(strengths),
            weaknesses=self._to_json(weaknesses),
            learning_summary=learning_summary,
            learning_path=self._to_json(data_driven_path),
            assessment_version="1.0"
        )
        self.db.add(result)
        await self.db.commit()
        await self.db.refresh(result)

        # Reflect completion on the learner's profile (if one exists).
        await LearnerService(self.db).mark_assessment_completed(session.learner_id)

        # Award assessment XP and first_assessment badge
        from app.services.gamification_service import GamificationService
        await GamificationService(self.db).award_xp(session.learner_id, 50, activity_type="assessment")

        return self._serialize_result(result)

    async def get_assessment_result(
        self, session_id: str, user_id: str | None = None
    ) -> dict[str, Any] | None:
        """
        Get assessment result.

        Args:
            session_id: Session ID
            user_id: User ID (optional)

        Returns:
            Serialized assessment result if found, None otherwise
        """
        query = select(AssessmentResult).where(AssessmentResult.session_id == session_id)
        if user_id is not None:
            query = query.where(AssessmentResult.learner_id == user_id)

        result = await self.db.execute(query)
        row = result.scalar_one_or_none()
        return self._serialize_result(row) if row is not None else None

    async def get_assessment_history(self, user_id: str) -> list[dict[str, Any]]:
        """
        Get assessment history for user.

        Args:
            user_id: User ID

        Returns:
            List of serialized assessment results
        """
        result = await self.db.execute(
            select(AssessmentResult)
            .where(AssessmentResult.learner_id == user_id)
            .order_by(AssessmentResult.created_at.desc())
        )
        return [self._serialize_result(row) for row in result.scalars().all()]
