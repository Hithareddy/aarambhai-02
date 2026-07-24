import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin

class GameCategory(Base, TimestampMixin):
    """Categorization of games e.g. Vocabulary, Logic, Listening"""
    __tablename__ = "game_categories"
    
    id = Column(String, primary_key=True, index=True) # e.g. 'vocab', 'logic'
    title = Column(String, nullable=False)
    description = Column(String)
    icon_url = Column(String)
    order_index = Column(Integer, default=0)

class Game(Base, TimestampMixin):
    """Core Game engine definition e.g. 'flash_cards', 'memory_match'"""
    __tablename__ = "games"
    
    id = Column(String, primary_key=True, index=True) # string slug e.g. memory_match
    category_id = Column(String, ForeignKey("game_categories.id"))
    title = Column(String, nullable=False)
    description = Column(String)
    thumbnail_url = Column(String)
    is_active = Column(Boolean, default=True)
    engine_type = Column(String) # e.g. 'card_engine', 'drag_drop'
    
    # Configuration JSON mapping (e.g. default time limits, required mechanics)
    config = Column(JSONB, default=dict)

    category = relationship("GameCategory")
    levels = relationship("GameLevel", back_populates="game")

class GameLevel(Base, TimestampMixin):
    """Levels 1 to 5 mapping for adaptive scaling."""
    __tablename__ = "game_levels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), index=True)
    level_number = Column(Integer, nullable=False) # 1 - 5
    description = Column(String)
    
    # Specific constraints for this level e.g. {"grid_size": 4, "time_limit": 60}
    mechanics_config = Column(JSONB, default=dict)
    
    game = relationship("Game", back_populates="levels")

class GameContent(Base, TimestampMixin):
    """Unified generic content node (e.g. 'Apple', 'Dog'). Used across all games."""
    __tablename__ = "game_content_nodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_category = Column(String, index=True) # e.g. 'Fruits', 'Animals'
    difficulty_level = Column(Integer, index=True) # 1 - 5
    
    # English target (Learning Language base)
    target_text = Column(String, nullable=False) 
    
    image_url = Column(String)
    audio_url = Column(String)
    
    # Additional context for advanced engines
    metadata_json = Column(JSONB, default=dict)

class GameAsset(Base, TimestampMixin):
    """External binary links management for specific games."""
    __tablename__ = "game_assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(String, ForeignKey("games.id"))
    asset_type = Column(String) # image, audio, generic
    asset_url = Column(String, nullable=False)

class GameSession(Base, TimestampMixin):
    """An instance of a Learner actively playing a game."""
    __tablename__ = "game_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    game_id = Column(String, ForeignKey("games.id"), index=True)
    level = Column(Integer, default=1)
    
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime(timezone=True))
    
    status = Column(String, default="active") # active, completed, abandoned
    
    score = Column(Integer, default=0)
    
    attempts = relationship("GameAttempt", back_populates="session")

class GameAttempt(Base, TimestampMixin):
    """Granular interactive attempts inside a session (e.g. clicked Wrong Card)."""
    __tablename__ = "game_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"))
    
    interaction_type = Column(String) # e.g. click, drag, match
    target_id = Column(String) # The id of the content block interacted with
    is_correct = Column(Boolean)
    
    response_time_ms = Column(Integer)
    
    session = relationship("GameSession", back_populates="attempts")

class GameProgress(Base, TimestampMixin):
    """Cumulative leveling and persistent save states per game."""
    __tablename__ = "game_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    game_id = Column(String, ForeignKey("games.id"), index=True)
    
    highest_level_unlocked = Column(Integer, default=1)
    total_score = Column(Integer, default=0)
    play_count = Column(Integer, default=0)

class GameReward(Base, TimestampMixin):
    """Ledger table for economy distributions."""
    __tablename__ = "game_rewards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"))
    
    reward_type = Column(String) # 'stars', 'coins', 'xp'
    amount = Column(Integer, nullable=False)
    
    granted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Achievement(Base, TimestampMixin):
    """Milestone tracker specific to Games module."""
    __tablename__ = "achievements"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)
    icon_url = Column(String)
    trigger_rule = Column(JSONB) # Logic defining unlock

class FlashCard(Base, TimestampMixin):
    """Standalone table requested for specific tracking of Flashcard decks."""
    __tablename__ = "flash_cards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(UUID(as_uuid=True), ForeignKey("game_content_nodes.id"))
    deck_category = Column(String) # Animals, Colors
    is_favorite = Column(Boolean, default=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True) # if favorite/custom

class FlashCardTranslation(Base, TimestampMixin):
    """Localized lookup for flashcards mapping English content to the Website Language."""
    __tablename__ = "flash_card_translations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(UUID(as_uuid=True), ForeignKey("game_content_nodes.id"))
    language_code = Column(String, index=True) # e.g. hi, te
    translated_text = Column(String, nullable=False)
    audio_url = Column(String)

class GameStatistics(Base, TimestampMixin):
    """Aggregated global player stats (accuracy, favorite game)."""
    __tablename__ = "game_statistics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    total_games_played = Column(Integer, default=0)
    total_time_played_seconds = Column(Integer, default=0)
    global_accuracy = Column(Float, default=0.0)
    
    weakest_categories = Column(JSONB, default=list)

class DailyChallenge(Base, TimestampMixin):
    """Constructed sequence of 3-5 mini games tailored for a user each day."""
    __tablename__ = "daily_challenges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date_assigned = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc).date())
    
    sequence_configuration = Column(JSONB) # array of game_ids and configured difficulty targets
    is_completed = Column(Boolean, default=False)
    reward_multiplier = Column(Float, default=1.5)

class GameSettings(Base, TimestampMixin):
    """User-specific settings configuring the Play experience."""
    __tablename__ = "game_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    learning_language = Column(String, default="en") # Critical constraint: game content
    website_language = Column(String, default="te") # Critical constraint: UI
    
    bgm_enabled = Column(Boolean, default=True)
    sfx_enabled = Column(Boolean, default=True)
