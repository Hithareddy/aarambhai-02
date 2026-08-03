from datetime import datetime
from typing import List, Tuple, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import LearnerProfile
from app.models.tutor import TutorConversation, TutorMessage
from app.services.tutor_ai_service import TutorAIService
from app.services.tutor_context_builder import TutorContextBuilder
import logging

logger = logging.getLogger(__name__)


class TutorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = TutorAIService()

    async def get_learner_profile(self, user_id: str) -> LearnerProfile:
        """Fetch learner profile or raise error."""
        result = await self.db.execute(
            select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ValueError("Learner profile not found for user.")
        return profile

    async def get_tutor_name(self, user_id: str) -> str:
        """Get chosen tutor name for learner (defaults to 'Mira')."""
        profile = await self.get_learner_profile(user_id)
        return profile.tutor_name or "Mira"

    async def update_tutor_name(self, user_id: str, new_name: str) -> str:
        """Update learner's tutor name preference."""
        clean_name = new_name.strip()
        if not clean_name or len(clean_name) > 50:
            raise ValueError("Tutor name must be between 1 and 50 characters.")

        profile = await self.get_learner_profile(user_id)
        profile.tutor_name = clean_name
        await self.db.commit()
        await self.db.refresh(profile)

        # Update active conversation tutor_name as well
        conversations = await self.get_learner_conversations(user_id)
        for conv in conversations:
            conv.tutor_name = clean_name
        await self.db.commit()

        return clean_name

    async def get_learner_conversations(self, user_id: str) -> List[TutorConversation]:
        """Fetch all conversation sessions for a learner."""
        result = await self.db.execute(
            select(TutorConversation)
            .options(selectinload(TutorConversation.messages))
            .where(TutorConversation.user_id == user_id)
            .order_by(TutorConversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_or_create_active_conversation(self, user_id: str) -> TutorConversation:
        """Get latest active conversation or create a new initial session."""
        conversations = await self.get_learner_conversations(user_id)
        if conversations:
            return conversations[0]

        return await self.create_new_conversation(user_id)

    async def create_new_conversation(self, user_id: str) -> TutorConversation:
        """Start a new conversation session and insert initial greeting."""
        profile = await self.get_learner_profile(user_id)
        tutor_name = profile.tutor_name or "Mira"
        learner_name = profile.name or "Learner"

        conversation = TutorConversation(
            user_id=user_id,
            tutor_name=tutor_name,
            title=f"Practice with {tutor_name}",
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)

        # Initial friendly tutor greeting message
        greeting_text = (
            f"Hi {learner_name}! I'm {tutor_name} 👋 "
            f"I'm excited to help you practice {profile.learning_language}. What would you like to talk about today?"
        )
        initial_msg = TutorMessage(
            conversation_id=conversation.id,
            user_id=user_id,
            role="tutor",
            content=greeting_text,
            created_at=datetime.utcnow()
        )
        self.db.add(initial_msg)
        await self.db.commit()

        return conversation

    async def get_conversation_messages(self, user_id: str, conversation_id: str) -> List[TutorMessage]:
        """Get all messages for a specific conversation."""
        result = await self.db.execute(
            select(TutorMessage)
            .where(TutorMessage.conversation_id == conversation_id)
            .where(TutorMessage.user_id == user_id)
            .order_by(TutorMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def chat(
        self,
        user_id: str,
        conversation_id: str,
        message_text: str,
        mode: str = "free_talk",
        mode_params: Optional[dict] = None,
        screen_context: Optional[dict] = None,
    ) -> Tuple[TutorMessage, TutorMessage]:
        """
        Process learner message with context builder, call LLM service, and return (user_msg, tutor_reply).
        """
        clean_text = message_text.strip()
        if not clean_text:
            raise ValueError("Message content cannot be empty.")

        profile = await self.get_learner_profile(user_id)
        tutor_name = profile.tutor_name or "Mira"

        # Check conversation ownership
        result = await self.db.execute(
            select(TutorConversation)
            .where(TutorConversation.id == conversation_id)
            .where(TutorConversation.user_id == user_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise ValueError("Conversation session not found.")

        # Backend assessment safety sanitization
        sanitized_screen_context = None
        if screen_context:
            sanitized_screen_context = dict(screen_context)
            if sanitized_screen_context.get("assessment_mode") is True:
                sanitized_screen_context["correct_answer"] = None

        # Build compact, structured learner context
        context_builder = TutorContextBuilder(self.db)
        learner_context = await context_builder.build_context(user_id, screen_context=sanitized_screen_context)

        # Save user message to DB
        user_msg = TutorMessage(
            conversation_id=conversation.id,
            user_id=user_id,
            role="learner",
            content=clean_text,
            created_at=datetime.utcnow()
        )
        self.db.add(user_msg)
        await self.db.commit()

        # Fetch recent message history (last 8 messages) for LLM context efficiency
        messages_history = await self.get_conversation_messages(user_id, conversation_id)
        formatted_history = [
            {"role": m.role, "content": m.content}
            for m in messages_history[-8:]
        ]

        # Call TutorAIService with learner context and practice mode
        tutor_reply_text = await self.ai_service.generate_tutor_reply(
            tutor_name=tutor_name,
            context=learner_context,
            messages_history=formatted_history,
            mode=mode,
            mode_params=mode_params,
        )

        # Save tutor reply to DB
        tutor_reply_msg = TutorMessage(
            conversation_id=conversation.id,
            user_id=user_id,
            role="tutor",
            content=tutor_reply_text,
            created_at=datetime.utcnow()
        )
        self.db.add(tutor_reply_msg)
        conversation.updated_at = datetime.utcnow()
        await self.db.commit()

        # Award 5 XP for engaging with AI Tutor
        from app.services.gamification_service import GamificationService
        await GamificationService(self.db).award_xp(user_id, 5, activity_type="tutor")

        return user_msg, tutor_reply_msg
