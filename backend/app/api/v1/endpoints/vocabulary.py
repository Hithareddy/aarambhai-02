"""
API endpoints for Word of the Day and My Words collection.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.vocabulary import (
    WordOfTheDayResponse,
    SentenceCheckRequest,
    SentenceCheckResponse,
    MyWordsResponse,
)
from app.services.vocabulary_service import VocabularyService

router = APIRouter()


@router.get(
    "/today",
    response_model=WordOfTheDayResponse,
    status_code=status.HTTP_200_OK,
)
async def get_today_word(
    target_date: Optional[date] = Query(None, alias="date", description="Reference date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve today's assigned Word of the Day for the authenticated learner.
    Ensures a stable word assignment per calendar day.
    """
    service = VocabularyService(db)
    return await service.get_today_word(current_user.id, target_date)


@router.post(
    "/check-sentence",
    response_model=SentenceCheckResponse,
    status_code=status.HTTP_200_OK,
)
async def check_sentence(
    payload: SentenceCheckRequest,
    target_date: Optional[date] = Query(None, alias="date", description="Reference date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate learner sentence attempt for today's word.
    Marks word as completed upon successful validation.
    """
    service = VocabularyService(db)
    return await service.check_sentence(current_user.id, payload.sentence, target_date)


@router.get(
    "/my-words",
    response_model=MyWordsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_my_words(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all previously learned vocabulary items in the learner's 'My Words' collection.
    """
    service = VocabularyService(db)
    return await service.get_my_words(current_user.id)
