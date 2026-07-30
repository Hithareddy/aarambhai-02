"""
Public Announcements endpoints for learners.
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.announcement import Announcement

router = APIRouter()


@router.get("", response_model=List[Dict[str, Any]])
async def get_active_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get active announcements for the learner dashboard.
    """
    res = await db.execute(
        select(Announcement)
        .where(Announcement.is_active.is_(True))
        .order_by(desc(Announcement.created_at))
        .limit(5)
    )
    announcements = res.scalars().all()

    return [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "target_audience": a.target_audience,
        "created_at": a.created_at,
    } for a in announcements]
