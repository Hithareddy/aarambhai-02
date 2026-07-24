from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.services.practice_service import PracticeService
from app.schemas.practice import TodaysLearningResponse

router = APIRouter()

@router.get("/todays-learning", response_model=TodaysLearningResponse)
async def get_todays_learning(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Assemble the 'Today's Learning' dynamic module flow.
    Compiles sequential lessons alongside spacing/revision reinforcement activities.
    """
    service = PracticeService(db)
    
    try:
        response = await service.get_todays_learning_plan(current_user.id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Today's Learning pipeline: {str(e)}"
        )
