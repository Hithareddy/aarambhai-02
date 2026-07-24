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
    """Initializes a new game session and returns the seed content."""
    
    # 1. Verify Game exists
    result = await db.execute(select(Game).where(Game.id == game_id, Game.is_active == True))
    game = result.scalars().first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found or inactive")
        
    # 2. Spawn Session
    session = GameSession(
        user_id=current_user.id,
        game_id=game.id,
        level=level
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Returning mock seed representation. Later this will dynamically query GameContent via adaptive AI limits.
    return {
        "session_id": str(session.id),
        "game_id": game.id,
        "engine_type": game.engine_type,
        "content_payload": [], # The active session array
        "config": game.config
    }
