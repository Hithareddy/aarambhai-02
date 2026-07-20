"""
Assessment service layer.

Handles business logic for assessment blueprint generation, session management,
and result calculation.
"""
import json
from datetime import datetime
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
from app.schemas.assessment import (
    AssessmentBlueprintCreate,
    AssessmentSessionCreate,
    QuestionResponseCreate,
)

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

    def serialize_question_for_assessment(self, question: Question) -> dict:
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

        TODO: Implement blueprint generation logic
        - Analyze learner profile
        - Select appropriate domains and skills
        - Determine question distribution
        - Calculate estimated duration
        - Create blueprint record

        Args:
            blueprint_data: Blueprint creation data
            user_id: User ID

        Returns:
            Generated assessment blueprint
        """
        raise NotImplementedError("Blueprint generation not yet implemented")

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
            blueprint = await self._get_or_create_default_blueprint()

        session = AssessmentSession(
            learner_id=user_id,
            blueprint_id=blueprint.id,
            status="in_progress",
            current_question_index=0,
            current_difficulty=blueprint.min_difficulty,
            start_time=datetime.utcnow(),
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

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

        # Try to get question at current difficulty
        query = select(Question).where(
            Question.is_active.is_(True),
            Question.difficulty == session.current_difficulty,
        )
        if previous_question_ids:
            query = query.where(Question.id.notin_(previous_question_ids))

        query = query.order_by(Question.created_at.asc()).limit(1)
        result = await self.db.execute(query)
        question = result.scalar_one_or_none()

        # If no question at current difficulty, try higher difficulties
        if not question:
            for diff in range(session.current_difficulty + 1, 6):
                query = select(Question).where(
                    Question.is_active.is_(True),
                    Question.difficulty == diff,
                )
                if previous_question_ids:
                    query = query.where(Question.id.notin_(previous_question_ids))
                query = query.order_by(Question.created_at.asc()).limit(1)
                result = await self.db.execute(query)
                question = result.scalar_one_or_none()
                if question:
                    break

        # If still no question, try lower difficulties
        if not question:
            for diff in range(session.current_difficulty - 1, 0, -1):
                query = select(Question).where(
                    Question.is_active.is_(True),
                    Question.difficulty == diff,
                )
                if previous_question_ids:
                    query = query.where(Question.id.notin_(previous_question_ids))
                query = query.order_by(Question.created_at.asc()).limit(1)
                result = await self.db.execute(query)
                question = result.scalar_one_or_none()
                if question:
                    break

        if question is None:
            raise ValueError("No more questions available")

        return self.serialize_question_for_assessment(question)

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
        strengths = [s["skill"] for s in skill_proficiencies if s["proficiency"] >= 0.7]
        weaknesses = [s["skill"] for s in skill_proficiencies if s["proficiency"] < 0.5]

        # Generate simple learning path (placeholder)
        learning_path = {
            "recommended_start": weaknesses[0] if weaknesses else skill_proficiencies[0]["skill"] if skill_proficiencies else "general",
            "path": [s["skill"] for s in skill_proficiencies]
        }

        # Update session status
        session.status = "completed"
        session.end_time = datetime.utcnow()

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
