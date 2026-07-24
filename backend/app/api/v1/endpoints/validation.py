from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.validation_service import ValidationService

router = APIRouter()

@router.get("/report", response_model=Dict[str, Any])
async def get_validation_report(
    db: AsyncSession = Depends(get_db),
    # Optional: Secure this exclusively for admins if a role system exists
    current_user: User = Depends(get_current_active_user),
):
    """
    Run the QA curriculum validation service and return the system integrity report.
    """
    service = ValidationService(db)
    report = await service.run_curriculum_audit()
    return report
