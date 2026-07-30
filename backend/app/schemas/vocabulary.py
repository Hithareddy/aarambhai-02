"""
Pydantic schemas for Word of the Day and My Words vocabulary collection.
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class WordOfTheDayResponse(BaseModel):
    """
    Schema representing the daily word assigned to a learner.
    """
    id: str
    word: str
    phonetic: Optional[str] = None
    language: str
    meaning_en: str
    meaning_support: str
    support_language: str
    example_sentence: str
    assigned_date: date
    is_completed: bool = False
    learner_sentence: Optional[str] = None


class SentenceCheckRequest(BaseModel):
    """
    Learner's sentence attempt using the daily word.
    """
    sentence: str = Field(..., min_length=1, max_length=500)


class SentenceCheckResponse(BaseModel):
    """
    Feedback response for learner's sentence attempt.
    """
    is_valid: bool
    feedback_message: str
    is_completed: bool
    learned_word: Optional[WordOfTheDayResponse] = None


class LearnedWordItem(BaseModel):
    """
    Schema for a previously learned vocabulary word in 'My Words'.
    """
    id: str
    word: str
    phonetic: Optional[str] = None
    language: str
    meaning_en: str
    meaning_support: str
    example_sentence: str
    learner_sentence: str
    learned_date: date


class MyWordsResponse(BaseModel):
    """
    List of all words learned by the learner.
    """
    total_count: int
    words: List[LearnedWordItem]
