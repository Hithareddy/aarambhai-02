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
DEFAULT_QUESTION_COUNT = 8


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
        }

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
            "learning_path": self._from_json(result.learning_path),
            "created_at": result.created_at,
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

        previous_response_result = await self.db.execute(
            select(QuestionResponse.question_id).where(QuestionResponse.session_id == session_id)
        )
        previous_question_ids = list(previous_response_result.scalars().all())

        # Stop once the learner has answered the number of questions defined by
        # the session's blueprint. This signals the frontend to complete.
        blueprint = await self.db.get(AssessmentBlueprint, session.blueprint_id)
        question_count = blueprint.question_count if blueprint else DEFAULT_QUESTION_COUNT
        if len(previous_question_ids) >= question_count:
            raise ValueError("No more questions available")

        # Determine target language from learner profile
        profile = await LearnerService(self.db).get_learner_profile_by_user_id(session.learner_id)
        target_language = (profile.learning_language or "en").strip().lower() if profile else "en"

        # Check if questions exist for this target language
        lang_count_result = await self.db.execute(
            select(Question.id).where(
                Question.is_active.is_(True),
                Question.language == target_language
            ).limit(1)
        )
        has_target_lang_content = lang_count_result.scalar() is not None

        # Fallback to English if target language does not have questions seeded
        is_fallback = False
        query_language = target_language
        if target_language != "en" and not has_target_lang_content:
            query_language = "en"
            is_fallback = True

        # Target domains/skills and language specified by blueprint and profile fallback
        base_query = select(Question).where(
            Question.is_active.is_(True),
            Question.language == query_language
        )
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

        # Try to get question at current difficulty, ordered randomly
        query = base_query.where(Question.difficulty == session.current_difficulty)
        if previous_question_ids:
            query = query.where(Question.id.notin_(previous_question_ids))

        query = query.order_by(func.random()).limit(1)
        result = await self.db.execute(query)
        question = result.scalar_one_or_none()

        # If no question at current difficulty, try higher difficulties
        if not question:
            for diff in range(session.current_difficulty + 1, 6):
                query = base_query.where(Question.difficulty == diff)
                if previous_question_ids:
                    query = query.where(Question.id.notin_(previous_question_ids))
                query = query.order_by(func.random()).limit(1)
                result = await self.db.execute(query)
                question = result.scalar_one_or_none()
                if question:
                    break

        # If still no question, try lower difficulties
        if not question:
            for diff in range(session.current_difficulty - 1, 0, -1):
                query = base_query.where(Question.difficulty == diff)
                if previous_question_ids:
                    query = query.where(Question.id.notin_(previous_question_ids))
                query = query.order_by(func.random()).limit(1)
                result = await self.db.execute(query)
                question = result.scalar_one_or_none()
                if question:
                    break

        if question is None:
            raise ValueError("No more questions available")

        return self.serialize_question_for_assessment(question, is_fallback=is_fallback)

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

        correct_answer = self._from_json(question.correct_answer)
        selected_answer = response_data.selected_answer
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

        # Get all responses for this session
        responses_result = await self.db.execute(
            select(QuestionResponse).where(QuestionResponse.session_id == session_id)
        )
        responses = responses_result.scalars().all()

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
        strengths = [s["skill"] for s in skill_proficiencies if float(s["proficiency"]) >= 0.7]
        weaknesses = [s["skill"] for s in skill_proficiencies if float(s["proficiency"]) < 0.5]

        # Generate simple learning path (placeholder)
        learning_path = {
            "recommended_start": weaknesses[0] if weaknesses else skill_proficiencies[0]["skill"] if skill_proficiencies else "general",
            "path": [s["skill"] for s in skill_proficiencies]
        }

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
            learning_path=self._to_json(learning_path),
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
