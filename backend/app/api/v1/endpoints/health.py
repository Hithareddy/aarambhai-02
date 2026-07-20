"""
Health check endpoint.

Provides a simple health check endpoint for monitoring and load balancers.
"""
from datetime import datetime

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint.

    Returns the application status and version information.
    Used by monitoring systems and load balancers.

    Returns:
        Dictionary with application status and metadata
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.utcnow().isoformat(),
    }
