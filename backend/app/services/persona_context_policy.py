"""
Persona context policy.

Single source of truth for "is this question suitable for this learner?".

The previous persona spec used an invented vocabulary (``image_mcq``,
``market``, ``vocabulary``) that does not exist in the question bank, so every
persona filter silently fell through and the workplace-heavy bank dominated
every assessment. This module speaks the *real* vocabulary stored on
``questions.domain`` / ``questions.question_type`` and defines, per persona:

* ``allow``   - contexts that feel written for this learner
* ``block``   - contexts that must NEVER be served to this learner
* ``preferred_types`` / ``avoid_types`` - real bank formats
* ``max_difficulty`` guard rails

Everything else in the engine consumes these tables, so persona correctness is
enforced in exactly one place.
"""
from __future__ import annotations

import json
from typing import Any, Iterable

# --------------------------------------------------------------------------- #
# Canonical context vocabulary
# --------------------------------------------------------------------------- #
# Left side = raw values seen on questions.domain / topic_category / tags.
# Right side = canonical context used by the persona policy below.
CONTEXT_ALIASES: dict[str, str] = {
    # child / school world
    "family": "family", "friends": "friends", "animals": "animals",
    "colors": "colors", "colours": "colors", "food": "food", "toys": "toys",
    "story": "story", "stories": "story", "school": "school",
    "school_basics": "school", "children_school": "school",
    "classroom": "classroom", "playground": "playground", "sports": "sports",
    "hobbies": "hobbies", "homework": "school", "spelling": "school",
    "shapes": "colors", "body_parts": "family", "fruits": "food",
    "vegetables": "food", "daily_routine": "everyday",
    # home / everyday world
    "home": "home", "cooking": "cooking", "shopping": "shopping",
    "market": "shopping", "neighbours": "neighbours", "neighbors": "neighbours",
    "everyday": "everyday", "social": "social", "phone_calls": "phone",
    "phone": "phone", "community": "community", "grammar": "grammar",
    "public_signs": "public_signs", "transport": "transport",
    "travel": "travel", "healthcare": "healthcare", "doctor_appointment": "healthcare",
    "clinic": "healthcare", "medicine_label": "healthcare",
    "banking": "banking", "atm": "banking", "investment": "banking",
    "government_forms": "government", "government": "government",
    "technology": "technology", "technology_basics": "technology",
    # study / work world
    "campus": "campus", "projects": "projects", "internship": "internship",
    "group_discussion": "group_discussion", "public_speaking": "public_speaking",
    "academic_reading": "campus", "presentations": "presentations",
    "workplace": "workplace", "corporate": "workplace", "office": "workplace",
    "meetings": "meetings", "email": "email", "interview": "interview",
    "customer_service": "customer_service",
}

CHILD_CONTEXTS = {
    "family", "friends", "animals", "colors", "food", "toys", "story",
    "school", "classroom", "playground",
}
ADULT_ONLY_CONTEXTS = {
    "workplace", "meetings", "email", "presentations", "interview",
    "customer_service", "banking", "government", "campus", "internship",
    "projects", "group_discussion", "public_speaking",
}

# --------------------------------------------------------------------------- #
# Per-persona policy (contexts + formats), using real bank values
# --------------------------------------------------------------------------- #
IMAGE_TYPES = {"image_audio_mcq", "image_reading", "image_scenario_mcq"}
HEAVY_TYPES = {"extended_response", "sentence_order"}

PERSONA_POLICY: dict[str, dict[str, Any]] = {
    "early_learner": {
        "allow": CHILD_CONTEXTS | {"everyday"},
        "block": ADULT_ONLY_CONTEXTS | {"healthcare", "transport", "grammar", "phone"},
        "preferred_types": [
            "image_audio_mcq", "image_reading", "image_scenario_mcq",
            "audio_mcq", "greeting_introduction", "short_response",
            "scenario_mcq", "reading_mcq",
        ],
        "avoid_types": ["extended_response", "sentence_order", "situational_response"],
        "hard_max_difficulty": 3,
    },
    "school_student": {
        "allow": CHILD_CONTEXTS | {
            "sports", "hobbies", "everyday", "home", "social", "transport",
            "grammar", "public_signs",
        },
        "block": ADULT_ONLY_CONTEXTS - {"public_speaking"} | {"healthcare"},
        "preferred_types": [
            "image_audio_mcq", "audio_mcq", "reading_mcq", "fill_blank",
            "scenario_mcq", "short_response", "image_reading",
            "greeting_introduction", "sentence_order",
        ],
        "avoid_types": ["extended_response"],
        "hard_max_difficulty": 4,
    },
    "college_student": {
        "allow": {
            "campus", "projects", "presentations", "internship",
            "group_discussion", "public_speaking", "everyday", "social",
            "transport", "shopping", "technology", "grammar", "public_signs",
            "interview", "email", "healthcare", "banking", "phone", "travel",
        },
        "block": {"toys", "animals", "colors", "playground", "classroom", "story"},
        "preferred_types": [
            "reading_mcq", "scenario_mcq", "extended_response",
            "situational_response", "fill_blank", "sentence_order",
            "audio_mcq", "short_response",
        ],
        "avoid_types": sorted(IMAGE_TYPES | {"greeting_introduction"}),
        "hard_max_difficulty": 5,
    },
    "homemaker": {
        "allow": {
            "home", "family", "cooking", "shopping", "healthcare", "travel",
            "transport", "neighbours", "banking", "phone", "everyday",
            "school", "social", "public_signs", "grammar", "community",
        },
        "block": {
            "workplace", "meetings", "email", "presentations", "interview",
            "customer_service", "campus", "internship", "projects",
            "group_discussion", "public_speaking", "toys", "playground",
        },
        "preferred_types": [
            "scenario_mcq", "audio_mcq", "image_audio_mcq",
            "situational_response", "short_response", "image_scenario_mcq",
            "reading_mcq", "greeting_introduction", "fill_blank",
        ],
        "avoid_types": ["extended_response", "sentence_order"],
        "hard_max_difficulty": 4,
    },
    "professional": {
        "allow": {
            "workplace", "meetings", "email", "presentations", "interview",
            "customer_service", "phone", "social", "everyday", "transport",
            "banking", "technology", "grammar", "public_signs", "healthcare",
            "travel", "shopping",
        },
        "block": {
            "toys", "animals", "colors", "playground", "classroom", "story",
            "friends",
        },
        "preferred_types": [
            "scenario_mcq", "reading_mcq", "extended_response",
            "situational_response", "fill_blank", "sentence_order",
            "audio_mcq", "short_response",
        ],
        "avoid_types": sorted(IMAGE_TYPES | {"greeting_introduction"}),
        "hard_max_difficulty": 5,
    },
    "senior_citizen": {
        "allow": {
            "healthcare", "family", "travel", "transport", "banking",
            "community", "government", "technology", "everyday", "social",
            "phone", "home", "shopping", "public_signs", "neighbours",
        },
        "block": {
            "workplace", "meetings", "email", "presentations", "interview",
            "customer_service", "campus", "internship", "projects",
            "group_discussion", "classroom", "playground", "toys", "school",
            "animals", "colors", "story",
        },
        "preferred_types": [
            "scenario_mcq", "audio_mcq", "image_audio_mcq",
            "situational_response", "short_response", "image_scenario_mcq",
            "reading_mcq", "greeting_introduction",
        ],
        "avoid_types": ["extended_response", "sentence_order"],
        "hard_max_difficulty": 4,
    },
    "general_adult": {
        "allow": {
            "everyday", "home", "family", "shopping", "cooking", "healthcare",
            "transport", "travel", "banking", "phone", "social", "neighbours",
            "public_signs", "grammar", "technology", "community", "workplace",
        },
        "block": {"toys", "playground", "classroom"},
        "preferred_types": [
            "scenario_mcq", "audio_mcq", "reading_mcq", "situational_response",
            "fill_blank", "short_response", "image_audio_mcq", "sentence_order",
        ],
        "avoid_types": [],
        "hard_max_difficulty": 5,
    },
}


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def canonical_context(raw: Any) -> str:
    """Map any raw domain/topic value onto the canonical context vocabulary."""
    key = _norm(raw).replace(" ", "_").replace("-", "_")
    return CONTEXT_ALIASES.get(key, key or "everyday")


def question_contexts(question: Any) -> set[str]:
    """All canonical contexts a question carries (domain, topic, tags)."""
    out: set[str] = set()
    for raw in (getattr(question, "domain", None), getattr(question, "topic_category", None)):
        if raw:
            out.add(canonical_context(raw))
    tags = getattr(question, "tags", None)
    if tags:
        try:
            parsed = json.loads(tags) if isinstance(tags, str) else tags
        except Exception:
            parsed = []
        for tag in parsed or []:
            t = _norm(tag)
            if t.startswith("context:"):
                out.add(canonical_context(t.split(":", 1)[1]))
    return out or {"everyday"}


def question_personas(question: Any) -> set[str]:
    """Personas explicitly declared on the question (persona:<key> tags / learner_type)."""
    out: set[str] = set()
    learner_type = getattr(question, "learner_type", None)
    if learner_type:
        raw = _norm(learner_type)
        if raw.startswith("["):
            try:
                out.update(_norm(x) for x in json.loads(learner_type))
            except Exception:
                pass
        else:
            out.add(raw)
    tags = getattr(question, "tags", None)
    if tags:
        try:
            parsed = json.loads(tags) if isinstance(tags, str) else tags
        except Exception:
            parsed = []
        for tag in parsed or []:
            t = _norm(tag)
            if t.startswith("persona:"):
                out.add(t.split(":", 1)[1])
    return out


def policy_for(persona: str) -> dict[str, Any]:
    return PERSONA_POLICY.get(persona or "", PERSONA_POLICY["general_adult"])


def is_suitable(question: Any, persona: str, spec: dict[str, Any] | None = None) -> bool:
    """
    Hard gate. Returns False when a question must never be shown to this
    learner — blocked real-life context, banned interaction format, or a
    difficulty above the persona / familiarity ceiling.
    """
    policy = policy_for(persona)

    if not getattr(question, "is_active", True):
        return False

    q_type = _norm(getattr(question, "question_type", ""))
    if not getattr(question, "question_content", None):
        return False
    if q_type not in ("speaking", "short_response", "extended_response", "situational_response",
                      "greeting_introduction") and not getattr(question, "options", None):
        return False

    # 1. Persona tags on curated content are authoritative.
    declared = question_personas(question)
    if declared and persona not in declared and "general" not in declared:
        return False

    # 2. Context boundaries — the core of "these questions are for me".
    contexts = question_contexts(question)
    blocked = {canonical_context(c) for c in policy["block"]}
    if contexts & blocked:
        return False

    # 3. Format boundaries.
    avoid = {_norm(t) for t in policy["avoid_types"]}
    if spec:
        avoid |= {_norm(t) for t in spec.get("avoid_types") or []}
    if q_type in avoid:
        return False

    # 4. Difficulty ceiling (persona + self-reported familiarity).
    difficulty = int(getattr(question, "difficulty", 1) or 1)
    ceiling = int(policy["hard_max_difficulty"])
    if spec:
        ceiling = min(ceiling, int(spec.get("max_difficulty", ceiling)))
    if difficulty > ceiling:
        return False

    return True


def context_fit_score(question: Any, persona: str) -> float:
    """Positive when the context is core to the persona's real life."""
    policy = policy_for(persona)
    allow = {canonical_context(c) for c in policy["allow"]}
    contexts = question_contexts(question)
    if contexts & allow:
        return 90.0
    if contexts == {"everyday"} or contexts == {"grammar"}:
        return 20.0
    return -40.0


def format_fit_score(question: Any, persona: str, spec: dict[str, Any] | None = None) -> float:
    preferred: Iterable[str] = (spec or {}).get("preferred_types") or policy_for(persona)["preferred_types"]
    preferred = [_norm(t) for t in preferred]
    q_type = _norm(getattr(question, "question_type", ""))
    if q_type in preferred:
        return (len(preferred) - preferred.index(q_type)) * 12.0
    return -50.0
