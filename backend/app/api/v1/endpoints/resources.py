from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.resource import Resource, ResourceBookmark
from app.models.assessment import AssessmentResult
from app.models.learner import LearnerProfile
from app.schemas.resource import ResourceOut, RecommendedResourceResponse

router = APIRouter()

@router.get("/", response_model=List[ResourceOut])
async def get_resources(
    type: Optional[str] = None,
    category: Optional[str] = None,
    skill: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve filtered resources from the curated library."""
    query = select(Resource).where(Resource.is_active == True)

    if type and type != "all":
        query = query.where(Resource.type == type)
    if category:
        query = query.where(Resource.category == category)
    if skill:
        query = query.where(Resource.recommended_skill == skill)
    if search:
        query = query.where(
            or_(
                Resource.title.ilike(f"%{search}%"),
                Resource.description.ilike(f"%{search}%"),
                Resource.category.ilike(f"%{search}%"),
            )
        )

    result = await db.execute(query)
    resources = result.scalars().all()

    # Fetch user bookmarks to attach is_bookmarked status
    bm_res = await db.execute(
        select(ResourceBookmark.resource_id).where(ResourceBookmark.user_id == str(current_user.id))
    )
    bookmarked_ids = set(bm_res.scalars().all())

    output = []
    for r in resources:
        item = ResourceOut.model_validate(r)
        item.is_bookmarked = r.id in bookmarked_ids
        output.append(item)

    return output


@router.get("/recommended", response_model=RecommendedResourceResponse)
async def get_recommended_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get personalized resource recommendations based on learner profile,
    initial assessment weak skills, and target language.
    """
    # 1. Fetch learner profile
    prof_res = await db.execute(
        select(LearnerProfile).where(LearnerProfile.user_id == str(current_user.id))
    )
    profile = prof_res.scalars().first()
    target_lang = profile.learning_language if profile else "en"
    age_group = profile.age_group if profile else "student"

    # 2. Fetch latest assessment result for weak skills
    ass_res = await db.execute(
        select(AssessmentResult)
        .where(AssessmentResult.learner_id == str(current_user.id))
        .order_by(AssessmentResult.created_at.desc())
    )
    latest_assessment = ass_res.scalars().first()

    target_skill = "vocabulary"
    reason = "Curated resources to build your foundational vocabulary."

    if latest_assessment and latest_assessment.weaknesses:
        import json
        try:
            weaknesses = json.loads(latest_assessment.weaknesses) if isinstance(latest_assessment.weaknesses, str) else latest_assessment.weaknesses
            if weaknesses and isinstance(weaknesses, list) and len(weaknesses) > 0:
                target_skill = str(weaknesses[0]).lower()
                reason = f"Recommended based on your initial check-in target area: {target_skill.capitalize()}."
        except Exception:
            pass

    # 3. Query resources matching target skill or language
    query = (
        select(Resource)
        .where(Resource.is_active == True)
        .where(
            or_(
                Resource.recommended_skill == target_skill,
                Resource.target_language == target_lang,
            )
        )
        .limit(6)
    )

    res = await db.execute(query)
    resources = res.scalars().all()

    # Fallback to general resources if matches are few
    if len(resources) < 3:
        fallback_res = await db.execute(select(Resource).where(Resource.is_active == True).limit(6))
        resources = fallback_res.scalars().all()

    bm_res = await db.execute(
        select(ResourceBookmark.resource_id).where(ResourceBookmark.user_id == str(current_user.id))
    )
    bookmarked_ids = set(bm_res.scalars().all())

    output = []
    for r in resources:
        item = ResourceOut.model_validate(r)
        item.is_bookmarked = r.id in bookmarked_ids
        output.append(item)

    return RecommendedResourceResponse(
        resources=output,
        recommendation_reason=reason,
        target_skill=target_skill,
    )


@router.post("/{resource_id}/bookmark")
async def toggle_bookmark(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Toggle persistent bookmark for a resource."""
    res = await db.execute(
        select(ResourceBookmark).where(
            and_(
                ResourceBookmark.user_id == str(current_user.id),
                ResourceBookmark.resource_id == resource_id,
            )
        )
    )
    existing = res.scalars().first()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"status": "unbookmarked", "resource_id": resource_id}
    else:
        new_bm = ResourceBookmark(user_id=str(current_user.id), resource_id=resource_id)
        db.add(new_bm)
        await db.commit()
        return {"status": "bookmarked", "resource_id": resource_id}


@router.get("/bookmarks/me", response_model=List[ResourceOut])
async def get_my_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fetch user's bookmarked resources."""
    query = (
        select(Resource)
        .join(ResourceBookmark, ResourceBookmark.resource_id == Resource.id)
        .where(ResourceBookmark.user_id == str(current_user.id))
    )
    res = await db.execute(query)
    resources = res.scalars().all()

    output = []
    for r in resources:
        item = ResourceOut.model_validate(r)
        item.is_bookmarked = True
        output.append(item)

    return output
