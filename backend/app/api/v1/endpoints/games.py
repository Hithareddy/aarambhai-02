from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.games import Game, GameCategory, GameSession, GameLevel

router = APIRouter()

@router.get("/categories")
async def get_game_categories(db: AsyncSession = Depends(get_db)):
    """Fetch all available game categories."""
    result = await db.execute(select(GameCategory).order_by(GameCategory.order_index))
    categories = result.scalars().all()
    return {"categories": [{"id": c.id, "title": c.title, "icon_url": c.icon_url} for c in categories]}

@router.get("/")
async def get_games(db: AsyncSession = Depends(get_db)):
    """Fetch all core games in the ecosystem."""
    result = await db.execute(select(Game).where(Game.is_active == True))
    games = result.scalars().all()
    return {"games": [{"id": g.id, "title": g.title, "thumbnail_url": g.thumbnail_url, "category_id": g.category_id} for g in games]}

@router.post("/{game_id}/start")
async def start_game_session(
    game_id: str,
    level: int = 1,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initializes a new game session and returns content resolved from assessment weaknesses."""
    
    # 1. Verify Game exists
    result = await db.execute(select(Game).where(Game.id == game_id, Game.is_active == True))
    game = result.scalars().first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found or inactive")
        
    # 2. Spawn Session
    session = GameSession(
        user_id=str(current_user.id),
        game_id=game.id,
        level=level
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # 3. Query Learner's latest AssessmentResult weaknesses to personalize game payload
    from app.models.assessment import AssessmentResult
    from app.models.question import Question
    from app.models.games import GameContent, FlashCard
    import json

    res_res = await db.execute(
        select(AssessmentResult)
        .where(AssessmentResult.learner_id == str(current_user.id))
        .order_by(AssessmentResult.created_at.desc())
    )
    latest_result = res_res.scalars().first()
    
    # Determine target skill focus from weaknesses
    target_skills = ["vocabulary", "reading", "grammar", "listening", "speaking"]
    if latest_result and latest_result.weaknesses:
        try:
            parsed_weaknesses = json.loads(latest_result.weaknesses) if isinstance(latest_result.weaknesses, str) else latest_result.weaknesses
            if parsed_weaknesses and isinstance(parsed_weaknesses, list):
                target_skills = [w.lower() for w in parsed_weaknesses] + target_skills
        except Exception:
            pass

    # 4. Fetch content matching game engine and target skills
    content_payload = []
    
    # Try fetching from FlashCard / GameContent OR fallback to Question bank items
    q_res = await db.execute(
        select(Question)
        .where(Question.skill.in_(target_skills), Question.is_active.is_(True))
        .order_by(Question.difficulty.asc())
        .limit(10)
    )
    questions = q_res.scalars().all()

    for q in questions:
        q_content = json.loads(q.question_content) if isinstance(q.question_content, str) else q.question_content
        q_options = json.loads(q.options) if isinstance(q.options, str) else q.options
        content_payload.append({
            "id": str(q.id),
            "skill": q.skill,
            "difficulty": q.difficulty,
            "question_type": q.question_type,
            "prompt": q_content.get("text", "") if isinstance(q_content, dict) else str(q_content),
            "options": q_options,
            "audio_url": q.audio_url,
            "image_url": q.image_url,
            "correct_answer": q.correct_answer
        })

    return {
        "session_id": str(session.id),
        "game_id": game.id,
        "engine_type": game.engine_type,
        "target_skill": target_skills[0] if target_skills else "general",
        "content_payload": content_payload,
        "config": game.config or {}
    }

