"""
Question service layer.

Handles business logic for question bank operations.
"""
import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionUpdate


class QuestionService:
    """Service for question bank business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _to_json(value: Any) -> str:
        """Serialize schema JSON fields for storage in Text columns."""
        return json.dumps(value, ensure_ascii=False)

    @staticmethod
    def _from_json(value: str | None) -> Any:
        """Deserialize Text-backed JSON fields for API responses."""
        if value is None:
            return None
        return json.loads(value)

    def serialize_question(self, question: Question) -> dict[str, Any]:
        """Convert a Question ORM object into the response schema shape."""
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
            "is_active": question.is_active,
            "tags": self._from_json(question.tags),
            "created_at": question.created_at,
        }

    async def create_question(self, question_data: QuestionCreate) -> Question:
        """
        Create a new question.

        Args:
            question_data: Question creation data

        Returns:
            Created question
        """
        question = Question(
            learning_goal=question_data.learning_goal,
            domain=question_data.domain,
            skill=question_data.skill,
            difficulty=question_data.difficulty,
            question_type=question_data.question_type,
            language=question_data.language,
            question_content=self._to_json(question_data.question_content),
            options=self._to_json(question_data.options),
            correct_answer=self._to_json(question_data.correct_answer),
            tags=self._to_json(question_data.tags) if question_data.tags is not None else None,
            is_active=True,
        )

        self.db.add(question)
        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def get_question_by_id(self, question_id: str) -> Question | None:
        """
        Get question by ID.

        Args:
            question_id: Question ID

        Returns:
            Question if found, None otherwise
        """
        result = await self.db.execute(
            select(Question).where(Question.id == question_id, Question.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def list_questions(
        self,
        learning_goal: str | None = None,
        domain: str | None = None,
        skill: str | None = None,
        difficulty: int | None = None,
        language: str = "en",
        skip: int = 0,
        limit: int = 100,
    ) -> list[Question]:
        """
        List questions with filtering and pagination.

        Args:
            learning_goal: Filter by learning goal
            domain: Filter by domain
            skill: Filter by skill
            difficulty: Filter by difficulty level
            language: Filter by language
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of matching questions
        """
        query = select(Question).where(Question.is_active.is_(True))

        if language is not None:
            query = query.where(Question.language == language)
        if learning_goal is not None:
            query = query.where(Question.learning_goal == learning_goal)
        if domain is not None:
            query = query.where(Question.domain == domain)
        if skill is not None:
            query = query.where(Question.skill == skill)
        if difficulty is not None:
            query = query.where(Question.difficulty == difficulty)

        query = query.order_by(Question.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_question(self, question_id: str, question_data: QuestionUpdate) -> Question:
        """
        Update question.

        Args:
            question_id: Question ID
            question_data: Update data

        Returns:
            Updated question

        Raises:
            ValueError: If question not found
        """
        question = await self.get_question_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")

        update_data = question_data.model_dump(exclude_unset=True)
        json_fields = {"question_content", "options", "correct_answer", "tags"}

        for field, value in update_data.items():
            if field in json_fields:
                setattr(question, field, self._to_json(value) if value is not None else None)
            else:
                setattr(question, field, value)

        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def delete_question(self, question_id: str) -> None:
        """
        Soft delete question.

        Args:
            question_id: Question ID

        Raises:
            ValueError: If question not found
        """
        question = await self.get_question_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")

        question.is_active = False
        await self.db.commit()

    async def select_questions_for_assessment(
        self,
        blueprint_id: str,
        current_difficulty: int,
        previous_question_ids: list[str],
    ) -> Question:
        """
        Select next question for assessment using adaptive algorithm.

        Selects the oldest active question at the current difficulty,
        excluding questions that have already been asked in the session.

        Args:
            blueprint_id: Blueprint ID
            current_difficulty: Current difficulty level
            previous_question_ids: IDs of already asked questions

        Returns:
            Selected question

        Raises:
            ValueError: If no suitable question found
        """
        query = select(Question).where(
            Question.is_active.is_(True),
            Question.difficulty == current_difficulty,
        )
        if previous_question_ids:
            query = query.where(Question.id.notin_(previous_question_ids))

        query = query.order_by(Question.created_at.asc()).limit(1)
        result = await self.db.execute(query)
        question = result.scalar_one_or_none()
        if question is None:
            raise ValueError("No suitable question found")
        return question
