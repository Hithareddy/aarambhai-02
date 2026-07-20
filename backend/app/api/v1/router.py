"""
API v1 router aggregation.

Combines all API v1 routers into a single router for version management.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    assessments,
    auth,
    health,
    learners,
    questions,
    users,
)

api_router = APIRouter()

# Health check endpoint
api_router.include_router(health.router, prefix="/health", tags=["health"])

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# User endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Learner profile endpoints
api_router.include_router(learners.router, prefix="/learners", tags=["learners"])

# Assessment endpoints
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])

# Question bank endpoints
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
