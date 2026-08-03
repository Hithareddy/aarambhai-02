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
    learning,
    validation,
    practice,
    games,
    activity,
    vocabulary,
    tutor,
    admin,
    announcements,
    resources,
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

# Learning module endpoints
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])

# Resource Library endpoints
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])

# Daily Practice & Spaced Repetition engine
api_router.include_router(practice.router, prefix="/practice", tags=["practice"])

# Developer Validation endpoints
api_router.include_router(validation.router, prefix="/dev/validation", tags=["developer-validation"])

# Games Endpoints
api_router.include_router(games.router, prefix="/games", tags=["games"])

# Activity Tracking Endpoints
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])

# Word of the Day & Vocabulary Endpoints
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["vocabulary"])

# AI Tutor Endpoints
api_router.include_router(tutor.router, prefix="/tutor", tags=["tutor"])

# Admin Endpoints
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Announcements Endpoints
api_router.include_router(announcements.router, prefix="/announcements", tags=["announcements"])

