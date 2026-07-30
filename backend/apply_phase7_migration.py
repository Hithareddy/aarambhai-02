import asyncio
import logging
from sqlalchemy import text
from app.db.session import async_session_factory

import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def apply_migration():
    logger.info("Applying Phase 7A AI Tutor Database Migration...")
    async with async_session_factory() as session:
        # Add tutor_name column to learner_profiles if not exists
        await session.execute(text("""
            ALTER TABLE learner_profiles 
            ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(100) DEFAULT 'Mira';
        """))

        # Create tutor_conversations table if not exists
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS tutor_conversations (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tutor_name VARCHAR(100) NOT NULL DEFAULT 'Mira',
                title VARCHAR(255) NOT NULL DEFAULT 'Practice Session',
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
            );
        """))

        # Index user_id on tutor_conversations
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_tutor_conversations_user_id 
            ON tutor_conversations(user_id);
        """))

        # Create tutor_messages table if not exists
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS tutor_messages (
                id VARCHAR(36) PRIMARY KEY,
                conversation_id VARCHAR(36) NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
                user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
            );
        """))

        # Index conversation_id and user_id on tutor_messages
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_tutor_messages_conversation_id 
            ON tutor_messages(conversation_id);
            CREATE INDEX IF NOT EXISTS ix_tutor_messages_user_id 
            ON tutor_messages(user_id);
        """))

        await session.commit()
        logger.info("Phase 7A AI Tutor Migration APPLIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(apply_migration())
