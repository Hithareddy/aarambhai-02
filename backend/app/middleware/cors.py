"""
CORS middleware configuration.

Configures Cross-Origin Resource Sharing for the API.
Note: This is typically configured in main.py using FastAPI's built-in CORS middleware.
This file is for reference and custom CORS logic if needed.
"""
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


def get_cors_middleware():
    """
    Get CORS middleware configuration.

    Returns configured CORS middleware based on settings.

    Returns:
        CORSMiddleware: Configured CORS middleware
    """
    return CORSMiddleware(
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
