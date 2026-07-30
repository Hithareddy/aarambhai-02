"""
PostgreSQL models for Daily Word of the Day and Learner Vocabulary ("My Words").
"""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class VocabularyWord(Base):
    """
    Curated daily vocabulary word bank per learning language.
    """
    __tablename__ = "vocabulary_words"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    language = Column(String(10), nullable=False, index=True) # e.g. 'en', 'hi', 'te'
    word = Column(String(100), nullable=False, index=True)
    phonetic = Column(String(100), nullable=True)
    meaning_en = Column(Text, nullable=False)
    meanings_json = Column(JSON, nullable=True, default=dict) # e.g. {"te": "...", "hi": "..."}
    example_sentence = Column(Text, nullable=False)
    difficulty_level = Column(String(20), nullable=False, default="Beginner") # Beginner, Intermediate, Advanced
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "language": self.language,
            "word": self.word,
            "phonetic": self.phonetic,
            "meaning_en": self.meaning_en,
            "meanings_json": self.meanings_json or {},
            "example_sentence": self.example_sentence,
            "difficulty_level": self.difficulty_level,
        }


class LearnerDailyWord(Base):
    """
    Tracks assigned Word of the Day per learner per date and their completion status.
    """
    __tablename__ = "learner_daily_words"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id = Column(String(36), ForeignKey("vocabulary_words.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_date = Column(Date, nullable=False, default=date.today, index=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    learner_sentence = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    word_rel = relationship("VocabularyWord", lazy="joined")
