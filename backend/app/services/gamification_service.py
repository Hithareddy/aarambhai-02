import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import GamificationProfile, Badge, UserBadge

logger = logging.getLogger(__name__)


class GamificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_profile(self, user_id: str) -> GamificationProfile:
        user_id_str = str(user_id)
        res = await self.db.execute(
            select(GamificationProfile).where(GamificationProfile.user_id == user_id_str)
        )
        profile = res.scalars().first()
        if not profile:
            profile = GamificationProfile(
                id=str(uuid.uuid4()),
                user_id=user_id_str,
                xp=0,
                level=1,
                daily_streak_count=1,
                last_active_date=datetime.now(timezone.utc)
            )
            self.db.add(profile)
            await self.db.commit()
            await self.db.refresh(profile)
        return profile

    async def award_xp(
        self, user_id: str, amount: int, activity_type: str = "general", metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Awards XP to a learner, updates level and streak, and checks for milestone badges.
        """
        profile = await self.get_or_create_profile(user_id)
        
        # 1. Update XP and calculate level
        profile.xp += amount
        profile.level = 1 + (profile.xp // 100)
        
        now = datetime.now(timezone.utc)
        
        # 2. Update streak tracking
        if not profile.last_active_date:
            profile.daily_streak_count = 1
        else:
            days_diff = (now.date() - profile.last_active_date.date()).days
            if days_diff == 1:
                profile.daily_streak_count += 1
            elif days_diff > 1:
                profile.daily_streak_count = 1
                
        profile.last_active_date = now
        await self.db.commit()
        await self.db.refresh(profile)
        
        # 3. Check and award relevant badges
        newly_earned_badges = await self._evaluate_badges(profile, activity_type, metadata or {})
        
        return {
            "xp": profile.xp,
            "level": profile.level,
            "daily_streak_count": profile.daily_streak_count,
            "earned_badges": newly_earned_badges
        }

    async def get_user_badges(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns list of badges earned by the user."""
        profile = await self.get_or_create_profile(user_id)
        res = await self.db.execute(
            select(UserBadge, Badge)
            .join(Badge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.gamification_profile_id == profile.id)
        )
        rows = res.all()
        return [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "category": b.category,
                "icon_url": b.icon_url,
                "earned_at": ub.earned_at.isoformat() if ub.earned_at else None
            }
            for ub, b in rows
        ]

    async def _evaluate_badges(
        self, profile: GamificationProfile, activity_type: str, metadata: Dict[str, Any]
    ) -> List[str]:
        earned = []
        
        # Ensure default system badges exist
        badges_to_check = [
            ("first_assessment", "First Step", "Completed your initial diagnostic placement test.", "Assessment"),
            ("first_lesson", "First Lesson", "Completed your very first interactive lesson.", "Learning"),
            ("xp_100", "Century Club", "Earned 100 XP across Aarambh AI.", "Progression"),
            ("streak_7", "7-Day Streak", "Maintained learning consistency for 7 consecutive days.", "Consistency"),
            ("perfect_quiz", "Sharpshooter", "Achieved 100% score on a quiz or practice session.", "Excellence"),
            ("voice_master", "Voice Master", "Completed a voice practice session with the AI Tutor.", "Speaking")
        ]
        
        for badge_id, name, desc, cat in badges_to_check:
            b_res = await self.db.execute(select(Badge).where(Badge.id == badge_id))
            b_obj = b_res.scalars().first()
            if not b_obj:
                b_obj = Badge(id=badge_id, name=name, description=desc, category=cat, is_active=True)
                self.db.add(b_obj)
                await self.db.commit()
                
            # Check if user already owns this badge
            ub_res = await self.db.execute(
                select(UserBadge).where(
                    and_(UserBadge.gamification_profile_id == profile.id, UserBadge.badge_id == badge_id)
                )
            )
            if ub_res.scalars().first():
                continue
                
            # Qualify rule check
            should_award = False
            if badge_id == "first_assessment" and activity_type == "assessment":
                should_award = True
            elif badge_id == "first_lesson" and activity_type == "lesson":
                should_award = True
            elif badge_id == "xp_100" and profile.xp >= 100:
                should_award = True
            elif badge_id == "streak_7" and profile.daily_streak_count >= 7:
                should_award = True
            elif badge_id == "perfect_quiz" and metadata.get("score") == 100:
                should_award = True
            elif badge_id == "voice_master" and activity_type == "voice_tutor":
                should_award = True
                
            if should_award:
                ub = UserBadge(
                    id=str(uuid.uuid4()),
                    gamification_profile_id=profile.id,
                    badge_id=badge_id,
                    earned_at=datetime.now(timezone.utc)
                )
                self.db.add(ub)
                await self.db.commit()
                earned.append(name)
                
        return earned
