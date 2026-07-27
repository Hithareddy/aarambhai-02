"""
Assessment service layer.

Handles business logic for assessment blueprint generation, session management,
and result calculation.
"""
import json
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

    def serialize_question_for_assessment(
        self, question: Question, is_fallback: bool | None = None
    ) -> dict:
        """Convert a Question ORM object into QuestionForAssessment shape."""
        return {
            "id": str(question.id),
            "learning_goal": question.learning_goal,
            "domain": question.domain,
            "skill": question.skill,
            "difficulty": question.difficulty,
            "question_type": question.question_type,
            "language": question.language,
            "question_content": self._from_json(question.question_content),
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
        self, question: Question, target_code: str
    ) -> tuple[dict, bool]:
        """
        Retrieves translation for a logical Question row, falling back to default English version.
        Returns: (serialized_question_dict, is_fallback)
        """
        target_code = target_code.strip().lower()
        
        # Serialize the default English version of the Question
        serialized = self.serialize_question_for_assessment(question, is_fallback=False)
        
        if target_code == "en":
            return serialized, False
            
        # Search translation table
        from app.models.translation import ContentTranslation
        result = await self.db.execute(
            select(ContentTranslation).where(
                ContentTranslation.entity_type == "question",
                ContentTranslation.entity_id == str(question.id),
                ContentTranslation.language_code == target_code
            )
        )
        translation = result.scalar_one_or_none()
        
        if translation:
            fields = self._from_json(translation.translated_fields)
            if "question_text" in fields:
                serialized["question_content"] = {"text": fields["question_text"]}
            elif "question_content" in fields:
                q_content = fields["question_content"]
                if isinstance(q_content, str):
                    serialized["question_content"] = {"text": q_content}
                else:
                    serialized["question_content"] = q_content
                    
            if "options" in fields:
                serialized["options"] = fields["options"]
            elif "option_a" in fields:
                serialized["options"] = [
                    {"id": "A", "text": fields["option_a"]},
                    {"id": "B", "text": fields["option_b"]},
                    {"id": "C", "text": fields["option_c"]},
                    {"id": "D", "text": fields["option_d"]}
                ]
            serialized["language"] = target_code
            return serialized, False
        else:
            serialized["is_fallback"] = True
            return serialized, True

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
        """Convert an AssessmentResult ORM row into the API response shape.

        JSON columns are stored as Text, so they must be parsed back into
        lists/dicts to satisfy the AssessmentResultResponse schema.
        """
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
        """
        Generate assessment blueprint based on learner profile.

        Analyzes the user's onboarding profile to personalize the domains, skills,
        duration, and difficulty limits of their placement test.
        """
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
        """
        Create assessment session.

        Args:
            session_data: Session creation data
            user_id: User ID

        Returns:
            Created assessment session
        """
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
            # Generate a personalized blueprint automatically for the user!
            try:
                from app.schemas.assessment import AssessmentBlueprintCreate
                blueprint = await self.generate_blueprint(
                    AssessmentBlueprintCreate(
                        learning_goal="Initial placement",
                        question_count=DEFAULT_QUESTION_COUNT,
                        min_difficulty=1,
                        max_difficulty=5,
                        estimated_duration_minutes=5,
                        domains=["Reading", "Grammar", "Vocabulary", "Listening", "Speaking", "Writing"],
                        skills=["reading", "grammar", "vocabulary", "listening", "speaking", "writing"],
                        question_distribution={}
                    ),
                    user_id
                )
            except Exception:
                # Fallback to the default placement blueprint if profile is missing / error
                blueprint = await self._get_or_create_default_blueprint()

        starting_difficulty = await self._starting_difficulty(user_id, blueprint)

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

    async def _starting_difficulty(
        self, user_id: str, blueprint: AssessmentBlueprint
    ) -> int:
        """
        Profile-aware initial difficulty.

        Per the assessment specification, starting difficulty is derived from the
        learner's stated familiarity so beginners start easy and advanced learners
        start higher. Falls back to the blueprint minimum when no profile exists.
        """
        profile = await LearnerService(self.db).get_learner_profile_by_user_id(user_id)
        if profile is None:
            return blueprint.min_difficulty

        familiarity = (profile.current_familiarity or "").strip().lower()
        if "advanced" in familiarity:
            level = 4
        elif "comfortable" in familiarity:
            level = 3
        elif "little" in familiarity:
            level = 2
        else:  # complete beginner / unknown
            level = 1

        return max(blueprint.min_difficulty, min(blueprint.max_difficulty, level))

    async def get_next_question(self, session_id: str, user_id: str | None = None) -> dict:
        """
        Get next question using adaptive algorithm.

        Args:
            session_id: Session ID
            user_id: User ID (optional)

        Returns:
            Question data for display

        Raises:
            ValueError: If session not found or completed
        """
        session = await self._get_active_session(session_id, user_id)
        
        # Load blueprint to ensure we stop when complete
        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        question_count = blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT

        # Single subquery to grab globally excluded question IDs for this learner
        global_exclude_subq = select(QuestionResponse.question_id).join(
            AssessmentSession, QuestionResponse.session_id == AssessmentSession.id
        ).where(AssessmentSession.learner_id == session.learner_id)
        
        # Fetch only the count of the current session's answered questions to check completion
        current_session_count = await self.db.scalar(
            select(func.count(QuestionResponse.id)).where(QuestionResponse.session_id == session_id)
        )
        current_session_count = current_session_count or 0

        if current_session_count >= question_count:
            raise ValueError("No more questions available")

        # Determine target language from learner profile
        profile = await LearnerService(self.db).get_learner_profile_by_user_id(session.learner_id)
        target_language = (profile.learning_language or "en").strip().lower() if profile else "en"

        # --- Skill-balance: prefer least-represented LSRW skill ---
        preferred_skills: list[str] | None = None
        if current_session_count > 0:
            # Query skill counts directly
            answered_counts_result = await self.db.execute(
                select(Question.skill, func.count(Question.id))
                .join(QuestionResponse, QuestionResponse.question_id == Question.id)
                .where(QuestionResponse.session_id == session_id)
                .group_by(Question.skill)
            )
            skill_counts = {s: 0 for s in LSRW_SKILLS}
            for skill, count in answered_counts_result:
                if skill in skill_counts:
                    skill_counts[skill] += count
            min_count = min(skill_counts.values())
            preferred_skills = [s for s in LSRW_SKILLS if skill_counts[s] == min_count]

        # Target domains/skills and language specified by blueprint (logical questions are in English)
        base_query = select(Question).where(
            Question.is_active.is_(True),
            Question.language == "en"
        )
        
        # Apply strict proficiency and contextual filters from profile
        if profile:
            prof_levels = ["Beginner", "Elementary", "Intermediate", "Advanced"]
            familiarity = (profile.current_familiarity or "").strip().lower()
            if "advanced" in familiarity:
                base_prof_idx = 3
            elif "comfortable" in familiarity:
                base_prof_idx = 2
            elif "little" in familiarity:
                base_prof_idx = 1
            else:
                base_prof_idx = 0
                
            # Real-time calibration based on current adaptive difficulty (1-5)
            diff = session.current_difficulty
            if diff >= 4:
                dynamic_prof_idx = 3
            elif diff == 3:
                dynamic_prof_idx = 2
            elif diff == 2:
                dynamic_prof_idx = 1
            else:
                dynamic_prof_idx = 0
                
            # Mix real-time performance with base onboarding to validate true proficiency
            target_profs = list(set([prof_levels[base_prof_idx], prof_levels[dynamic_prof_idx]]))
            
            from sqlalchemy import or_
            base_query = base_query.where(
                or_(
                    Question.proficiency_level.in_(target_profs),
                    Question.proficiency_level.is_(None)
                )
            )
            
            # Context filters: try to match, but allow NULLs as general questions
            from sqlalchemy import or_
            if profile.age_group:
                base_query = base_query.where(or_(Question.age_group == profile.age_group, Question.age_group.is_(None)))
            if profile.educational_background:
                base_query = base_query.where(or_(Question.education_level == profile.educational_background, Question.education_level.is_(None)))
            if profile.current_role:
                base_query = base_query.where(or_(Question.learner_type == profile.current_role, Question.learner_type.is_(None)))
        if blueprint:
            blueprint_domains = self._from_json(blueprint.domains) if blueprint.domains else []
            blueprint_skills = self._from_json(blueprint.skills) if blueprint.skills else []

            from sqlalchemy import or_
            conditions = []
            if blueprint_domains:
                conditions.append(Question.domain.in_(blueprint_domains))
                conditions.append(Question.domain.in_([d.lower() for d in blueprint_domains]))
                conditions.append(Question.domain.in_([d.capitalize() for d in blueprint_domains]))
            if blueprint_skills:
                conditions.append(Question.skill.in_(blueprint_skills))
                conditions.append(Question.skill.in_([s.lower() for s in blueprint_skills]))
                conditions.append(Question.skill.in_([s.capitalize() for s in blueprint_skills]))

            if conditions:
                base_query = base_query.where(or_(*conditions))

        # Skill-balanced base query: restrict to preferred (least-answered) skills
        # Falls back to the full base_query if no balanced question found.
        if preferred_skills:
            balanced_query = base_query.where(Question.skill.in_(preferred_skills))
        else:
            balanced_query = base_query

        # Ensure the query avoids historically asked questions using NOT IN (subquery)
        # Find a single question using database-native sorting for efficiency:
        # ORDER BY ABS(difficulty - current_difficulty) ASC, random()
        query = base_query.where(Question.id.notin_(global_exclude_subq))
        
        # Skill-balanced filter logic:
        # Instead of multiple loops covering every difficulty level, 
        # let the database handle finding the closest unasked difficulty for any preferred skill.
        if preferred_skills:
            balanced_query = query.where(Question.skill.in_(preferred_skills))
            final_query = balanced_query.order_by(
                func.abs(Question.difficulty - session.current_difficulty), 
                func.random()
            ).limit(1)
            result = await self.db.execute(final_query)
            question = result.scalar_one_or_none()
            if question:
                query = None  # mark as found
        
        if query is not None:
             # Fall back to base constraint (ignoring skill balancing if it's exhausted)
             final_query = query.order_by(
                 func.abs(Question.difficulty - session.current_difficulty), 
                 func.random()
             ).limit(1)
             result = await self.db.execute(final_query)
             question = result.scalar_one_or_none()
             
             # Final fallback: if NO global question is unasked, just pick ANY random question 
             # (not excluding globals, but excluding current session)
             if question is None:
                 local_exclude_subq = select(QuestionResponse.question_id).where(QuestionResponse.session_id == session_id)
                 fallback_query = base_query.where(Question.id.notin_(local_exclude_subq)).order_by(func.random()).limit(1)
                 result = await self.db.execute(fallback_query)
                 question = result.scalar_one_or_none()

        if question is None:
            # Diagnostic Query Logging if we ran out of questions
            import logging
            logger = logging.getLogger(__name__)
            try:
                total_q = await self.db.scalar(select(func.count(Question.id)))
                base_q = await self.db.scalar(select(func.count(Question.id)).where(Question.is_active.is_(True), Question.language == "en"))
                prof_q = await self.db.scalar(select(func.count(Question.id)).where(
                    Question.is_active.is_(True), Question.language == "en",
                    or_(
                        Question.proficiency_level.in_(target_profs) if profile else True,
                        Question.proficiency_level.is_(None)
                    )
                ))
                logger.warning(
                    f"No more questions available for session '{session_id}'. "
                    f"Stats -> Total: {total_q}, Base (Active EN): {base_q}, After Proficiency filter: {prof_q}. "
                    f"Check if remaining exclusions or blueprint requirements cleared out the pool."
                )
            except Exception as e:
                logger.warning(f"No more questions available. Failed to retrieve diagnostic stats: {e}")

            raise ValueError("No more questions available")

        # Resolve translation or fallback
        translated_dict, _ = await self._get_translated_question(question, target_language)
        return translated_dict

    async def submit_response(
        self, session_id: str, response_data: QuestionResponseCreate, user_id: str | None = None
    ) -> QuestionResponse:
        """
        Submit question response and update session state.

        Args:
            session_id: Session ID
            response_data: Response data

        Returns:
            Recorded response with correctness

        Raises:
            ValueError: If session not found or invalid
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
        
        # Speaking attempts are sent only after the server accepts their audio
        # upload. Until a real speech scorer is configured, record completion
        # without manufacturing a transcript or pronunciation score.
        if isinstance(selected_answer, str) and '"status":"spoken"' in selected_answer.replace(" ", ""):
            try:
                spoken_object = json.loads(selected_answer)
                selected_answer = spoken_object.get("selected_option", selected_answer)
                is_correct = question.question_type == "speaking"
            except json.JSONDecodeError:
                is_correct = selected_answer == correct_answer
        else:
            is_correct = selected_answer == correct_answer

        response = QuestionResponse(
            session_id=session.id,
            question_id=question.id,
            selected_answer=self._to_json(selected_answer),
            is_correct=is_correct,
            response_time_seconds=response_data.response_time_seconds,
            difficulty_at_response=session.current_difficulty,
        )

        session.current_question_index += 1
        next_difficulty = session.current_difficulty + 1 if is_correct else session.current_difficulty - 1
        session.current_difficulty = self._clamp_difficulty(next_difficulty)

        self.db.add(response)
        await self.db.commit()
        await self.db.refresh(response)
        await self.db.refresh(session)

        return response

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
        if accuracy >= 0.8:
            overall_proficiency = "Advanced"
        elif accuracy >= 0.6:
            overall_proficiency = "Intermediate"
        else:
            overall_proficiency = "Beginner"

        # Determine strengths and weaknesses
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
