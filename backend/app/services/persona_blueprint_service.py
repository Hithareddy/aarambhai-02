"""
Persona blueprint service.

Resolves a learner persona from the onboarding profile and derives the
assessment blueprint spec that drives the initial (placement) assessment:
flow, question sequence, question types, difficulty band, interaction style,
media expectations and scoring weights.

This service does NOT replace the existing AssessmentService — it feeds it.
"""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import AssessmentBlueprint

# --------------------------------------------------------------------------- #
# Persona specifications
# --------------------------------------------------------------------------- #
# Each spec drives: skill_mix (how many questions per skill), preferred_types
# (question formats in priority order), avoid_types (never serve), domains
# (real-life contexts that make the assessment feel written for this learner),
# difficulty band, interaction style and scoring weights.

PERSONA_SPECS: dict[str, dict[str, Any]] = {
    "early_learner": {
        "label": "Young learner (pre-literacy)",
        "description": "Under 12 and/or never attended school — picture and audio first, almost no reading.",
        "question_count": 10,
        "min_difficulty": 1,
        "max_difficulty": 3,
        "estimated_duration_minutes": 6,
        "interaction_style": "playful",
        "media_required": True,
        "reading_load": "none",
        "skill_mix": {
            "vocabulary": 3,
            "listening": 3,
            "speaking": 2,
            "reading": 1,
            "everyday_communication": 1,
        },
        "preferred_types": [
            "image_mcq",
            "image_selection",
            "image_identification",
            "listening_image",
            "picture_match",
            "match",
            "speaking",
            "true_false",
        ],
        "avoid_types": ["comprehension", "fill_blank", "arrange", "writing"],
        "domains": [
            "fruits", "vegetables", "animals", "colors", "body_parts", "family",
            "shapes", "toys", "school_basics", "home",
        ],
        "scoring_weights": {"attempt": 0.4, "accuracy": 0.6},
    },
    "school_student": {
        "label": "School student",
        "description": "Classroom vocabulary, reading, listening, spelling and simple sentence work.",
        "question_count": 14,
        "min_difficulty": 1,
        "max_difficulty": 4,
        "estimated_duration_minutes": 8,
        "interaction_style": "encouraging",
        "media_required": True,
        "reading_load": "light",
        "skill_mix": {
            "reading": 3,
            "listening": 3,
            "vocabulary": 3,
            "writing": 2,
            "speaking": 2,
            "everyday_communication": 1,
        },
        "preferred_types": [
            "image_mcq", "listening_image", "arrange_letters", "fill_blank",
            "arrange", "mcq", "match", "speaking", "comprehension",
        ],
        "avoid_types": [],
        "domains": [
            "school_campus", "classroom", "playground", "story", "friends",
            "daily_routine", "spelling", "home",
        ],
        "scoring_weights": {"attempt": 0.2, "accuracy": 0.8},
    },
    "college_student": {
        "label": "College student",
        "description": "Communication, comprehension, discussion, interviews, email and writing.",
        "question_count": 15,
        "min_difficulty": 2,
        "max_difficulty": 5,
        "estimated_duration_minutes": 10,
        "interaction_style": "direct",
        "media_required": False,
        "reading_load": "heavy",
        "skill_mix": {
            "reading": 3,
            "writing": 3,
            "speaking": 3,
            "listening": 3,
            "everyday_communication": 3,
        },
        "preferred_types": [
            "comprehension", "reading_scenario", "everyday_scenario", "mcq",
            "arrange", "fill_blank", "speaking", "match",
        ],
        "avoid_types": ["image_identification", "picture_match"],
        "domains": [
            "campus", "presentations", "group_discussion", "interview", "email",
            "internship", "public_speaking", "academic_reading",
        ],
        "scoring_weights": {"attempt": 0.1, "accuracy": 0.9},
    },
    "homemaker": {
        "label": "Homemaker",
        "description": "Shopping, cooking, doctor visits, children's school, transport and banking.",
        "question_count": 13,
        "min_difficulty": 1,
        "max_difficulty": 4,
        "estimated_duration_minutes": 8,
        "interaction_style": "warm",
        "media_required": True,
        "reading_load": "light",
        "skill_mix": {
            "listening": 3,
            "speaking": 3,
            "everyday_communication": 3,
            "vocabulary": 2,
            "reading": 2,
        },
        "preferred_types": [
            "everyday_scenario", "listening_image", "image_mcq", "mcq",
            "speaking", "match", "fill_blank",
        ],
        "avoid_types": ["comprehension"],
        "domains": [
            "market", "shopping", "vegetables", "cooking", "healthcare",
            "children_school", "transport", "banking", "neighbours", "home",
        ],
        "scoring_weights": {"attempt": 0.25, "accuracy": 0.75},
    },
    "professional": {
        "label": "Working professional",
        "description": "Workplace communication, meetings, email, presentations and customers.",
        "question_count": 15,
        "min_difficulty": 2,
        "max_difficulty": 5,
        "estimated_duration_minutes": 10,
        "interaction_style": "direct",
        "media_required": False,
        "reading_load": "heavy",
        "skill_mix": {
            "speaking": 3,
            "writing": 3,
            "reading": 3,
            "listening": 3,
            "everyday_communication": 3,
        },
        "preferred_types": [
            "everyday_scenario", "comprehension", "reading_scenario", "mcq",
            "fill_blank", "arrange", "speaking",
        ],
        "avoid_types": ["image_identification", "picture_match", "arrange_letters"],
        "domains": [
            "workplace", "meetings", "email", "presentations", "customer_service",
            "interview", "corporate", "phone_calls",
        ],
        "scoring_weights": {"attempt": 0.1, "accuracy": 0.9},
    },
    "senior_citizen": {
        "label": "Senior citizen",
        "description": "Hospitals, medicines, travel, banking, government offices and family.",
        "question_count": 12,
        "min_difficulty": 1,
        "max_difficulty": 4,
        "estimated_duration_minutes": 8,
        "interaction_style": "calm",
        "media_required": True,
        "reading_load": "light",
        "skill_mix": {
            "listening": 3,
            "speaking": 3,
            "everyday_communication": 3,
            "reading": 2,
            "vocabulary": 1,
        },
        "preferred_types": [
            "everyday_scenario", "listening_image", "image_mcq", "mcq",
            "speaking", "true_false",
        ],
        "avoid_types": ["arrange_letters", "arrange", "comprehension"],
        "domains": [
            "healthcare", "medicine_label", "travel", "banking", "government_forms",
            "family", "emergency", "transport",
        ],
        "scoring_weights": {"attempt": 0.3, "accuracy": 0.7},
    },
    "general_adult": {
        "label": "Everyday learner",
        "description": "Balanced everyday communication placement.",
        "question_count": 15,
        "min_difficulty": 1,
        "max_difficulty": 5,
        "estimated_duration_minutes": 9,
        "interaction_style": "encouraging",
        "media_required": True,
        "reading_load": "medium",
        "skill_mix": {
            "listening": 3,
            "speaking": 3,
            "reading": 3,
            "writing": 3,
            "everyday_communication": 3,
        },
        "preferred_types": [
            "mcq", "everyday_scenario", "listening_image", "image_mcq",
            "fill_blank", "arrange", "speaking", "comprehension",
        ],
        "avoid_types": [],
        "domains": [
            "daily_routine", "market", "transport", "phone_calls", "healthcare",
            "banking", "neighbours", "home",
        ],
        "scoring_weights": {"attempt": 0.2, "accuracy": 0.8},
    },
}

# Contexts that must never be served to a young learner.
CHILD_FORBIDDEN_DOMAINS = {
    "healthcare", "doctor_appointment", "clinic", "workplace", "corporate",
    "office", "atm", "banking", "investment", "government_forms",
    "medicine_label", "interview", "email", "customer_service", "meetings",
}


def _norm(value: Any) -> str:
    return (str(value or "")).strip().lower()


def resolve_persona_key(profile: Any) -> str:
    """Map a learner profile onto one of the supported persona keys."""
    if profile is None:
        return "general_adult"

    age = _norm(getattr(profile, "age_group", ""))
    edu = _norm(getattr(profile, "educational_background", ""))
    role = _norm(getattr(profile, "current_role", ""))

    is_child = "under" in age or "<12" in age or "child" in age or age.startswith("0")
    never_schooled = "never" in edu
    is_teen = "12" in age and "17" in age

    if is_child or (never_schooled and ("primary" in edu or is_child)):
        return "early_learner"
    if never_schooled and not any(k in role for k in ("professional", "working", "college")):
        return "early_learner"
    if "senior" in role or "retire" in role or "60+" in age or "60 +" in age:
        return "senior_citizen"
    if "homemaker" in role or "housewife" in role:
        return "homemaker"
    if "college" in role or "college" in edu or "university" in role or "beyond college" in edu:
        if "student" in role or "college" in role or "university" in role:
            return "college_student"
    if "school" in role and "student" in role:
        return "school_student"
    if "student" in role:
        if is_teen or "secondary" in edu or "primary" in edu:
            return "school_student"
        return "college_student"
    if any(k in role for k in ("professional", "working", "job", "employee", "business", "corporate", "teacher")):
        return "professional"
    if is_teen:
        return "school_student"
    return "general_adult"


def build_persona_spec(profile: Any) -> dict[str, Any]:
    """
    Return a fully-resolved persona spec for this learner, adjusted by their
    self-reported familiarity, learning goal and languages.
    """
    key = resolve_persona_key(profile)
    spec: dict[str, Any] = json.loads(json.dumps(PERSONA_SPECS[key]))  # deep copy
    spec["persona"] = key

    # The question bank only carries these five skills — fold any legacy
    # "vocabulary" slots into reading/listening so the mix is actually fillable.
    BANK_SKILLS = ("listening", "speaking", "reading", "writing", "everyday_communication")
    raw_mix = spec.get("skill_mix") or {}
    mix: dict[str, int] = {s: int(raw_mix.get(s, 0)) for s in BANK_SKILLS}
    leftover = sum(int(v) for k, v in raw_mix.items() if k not in BANK_SKILLS)
    for i in range(leftover):
        target = "reading" if i % 2 == 0 else "listening"
        mix[target] += 1
    spec["skill_mix"] = {s: v for s, v in mix.items() if v > 0}

    # Contexts and formats come from the single-source persona policy that
    # speaks the real question-bank vocabulary.
    policy = policy_for(key)
    spec["domains"] = sorted(policy["allow"])
    spec["blocked_domains"] = sorted(policy["block"])
    spec["preferred_types"] = list(policy["preferred_types"])
    spec["avoid_types"] = list(policy["avoid_types"])
    spec["max_difficulty"] = min(int(spec["max_difficulty"]), int(policy["hard_max_difficulty"]))
    spec["min_difficulty"] = min(int(spec["min_difficulty"]), int(spec["max_difficulty"]))

    familiarity = _norm(getattr(profile, "current_familiarity", ""))
    goal = _norm(getattr(profile, "learning_goal", ""))
    digital = _norm(getattr(profile, "digital_comfort", ""))


    # Familiarity shifts the difficulty band without leaving the persona range.
    if any(k in familiarity for k in ("advanced", "fluent")):
        spec["min_difficulty"] = min(spec["max_difficulty"], spec["min_difficulty"] + 2)
    elif any(k in familiarity for k in ("intermediate", "comfortable")):
        spec["min_difficulty"] = min(spec["max_difficulty"], spec["min_difficulty"] + 1)
    elif any(k in familiarity for k in ("none", "zero", "cannot", "beginner", "never")):
        spec["max_difficulty"] = max(spec["min_difficulty"], min(spec["max_difficulty"], 3))

    # Low digital comfort → simpler interactions, no drag/arrange formats.
    if any(k in digital for k in ("low", "not comfortable", "beginner", "never")):
        spec["avoid_types"] = sorted(set(spec["avoid_types"]) | {"arrange", "arrange_letters", "match"})

    # Learning goal tilts the skill mix toward the goal's dominant skill.
    goal_skill = None
    if any(k in goal for k in ("speak", "conversation", "fluency")):
        goal_skill = "speaking"
    elif any(k in goal for k in ("read",)):
        goal_skill = "reading"
    elif any(k in goal for k in ("writ", "email")):
        goal_skill = "writing"
    elif any(k in goal for k in ("listen", "understand")):
        goal_skill = "listening"
    elif any(k in goal for k in ("job", "interview", "career", "work")):
        goal_skill = "everyday_communication"

    if goal_skill and goal_skill in spec["skill_mix"]:
        spec["skill_mix"][goal_skill] += 1
        # keep the total stable by trimming the largest non-goal skill
        others = sorted(
            (s for s in spec["skill_mix"] if s != goal_skill),
            key=lambda s: spec["skill_mix"][s],
            reverse=True,
        )
        for s in others:
            if spec["skill_mix"][s] > 1:
                spec["skill_mix"][s] -= 1
                break
    spec["goal_skill"] = goal_skill

    spec["question_count"] = sum(spec["skill_mix"].values())
    spec["learning_goal"] = getattr(profile, "learning_goal", None) or "Initial placement"
    spec["website_language"] = _norm(getattr(profile, "website_language", "en")) or "en"
    spec["learning_language"] = _norm(getattr(profile, "learning_language", "en")) or "en"
    spec["forbidden_domains"] = sorted(CHILD_FORBIDDEN_DOMAINS) if key == "early_learner" else []
    return spec


def blueprint_id_for(spec: dict[str, Any]) -> str:
    """Deterministic, reusable blueprint id per persona + difficulty band + goal skill."""
    goal = re.sub(r"[^a-z0-9]+", "-", _norm(spec.get("learning_goal")))[:24].strip("-") or "general"
    key = (
        f"{spec['persona']}|{goal}|{spec['min_difficulty']}-{spec['max_difficulty']}|"
        f"{spec.get('goal_skill') or 'balanced'}|{spec['question_count']}"
    )
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
    return f"bp-{spec['persona'][:14]}-{digest}"


class PersonaBlueprintService:
    """Creates/reuses persona-specific assessment blueprints."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_blueprint(self, profile: Any) -> AssessmentBlueprint:
        spec = build_persona_spec(profile)
        bp_id = blueprint_id_for(spec)

        existing = (
            await self.db.execute(
                select(AssessmentBlueprint).where(AssessmentBlueprint.id == bp_id)
            )
        ).scalar_one_or_none()

        distribution = json.dumps(spec, ensure_ascii=False)

        if existing is not None:
            # Keep the stored spec fresh if the persona definitions evolved.
            if existing.question_distribution != distribution:
                existing.question_distribution = distribution
                existing.question_count = spec["question_count"]
                existing.min_difficulty = spec["min_difficulty"]
                existing.max_difficulty = spec["max_difficulty"]
                await self.db.commit()
                await self.db.refresh(existing)
            return existing

        blueprint = AssessmentBlueprint(
            id=bp_id,
            learning_goal=str(spec["learning_goal"])[:100],
            question_count=spec["question_count"],
            min_difficulty=spec["min_difficulty"],
            max_difficulty=spec["max_difficulty"],
            estimated_duration_minutes=spec["estimated_duration_minutes"],
            domains=json.dumps(spec["domains"], ensure_ascii=False),
            skills=json.dumps(list(spec["skill_mix"].keys()), ensure_ascii=False),
            question_distribution=distribution,
        )
        self.db.add(blueprint)
        await self.db.commit()
        await self.db.refresh(blueprint)
        return blueprint

    @staticmethod
    def spec_from_blueprint(blueprint: AssessmentBlueprint | None) -> dict[str, Any] | None:
        """Read the persona spec back out of a stored blueprint, if present."""
        if blueprint is None or not blueprint.question_distribution:
            return None
        try:
            data = json.loads(blueprint.question_distribution)
        except Exception:
            return None
        if isinstance(data, dict) and data.get("skill_mix"):
            return data
        return None
