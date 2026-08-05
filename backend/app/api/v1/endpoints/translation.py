from fastapi import APIRouter
from app.services.translation_service import router as translation_router

router = APIRouter()
router.include_router(translation_router, prefix="", tags=["translations"])
