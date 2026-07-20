"""
Question bank endpoints.

Handles question management and retrieval for assessments.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user, get_db
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
)
from app.services.question_service import QuestionService

router = APIRouter()


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: QuestionCreate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Create a new question.

    Adds a new question to the question bank.
    Requires authentication and appropriate permissions.

    Returns:
        QuestionResponse: Created question

    Raises:
        HTTPException: If validation fails or unauthorized
    """
    service = QuestionService(db)
    created_question = await service.create_question(question)
    return service.serialize_question(created_question)


@router.get("/", response_model=list[QuestionResponse])
async def list_questions(
    learning_goal: str | None = Query(None),
    domain: str | None = Query(None),
    skill: str | None = Query(None),
    difficulty: int | None = Query(None, ge=1, le=5),
    language: str = Query("en"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    List questions from question bank.

    Supports filtering by various criteria and pagination.
    Requires authentication.

    Returns:
        List of matching questions
    """
    service = QuestionService(db)
    questions = await service.list_questions(
        learning_goal=learning_goal,
        domain=domain,
        skill=skill,
        difficulty=difficulty,
        language=language,
        skip=skip,
        limit=limit,
    )
    return [service.serialize_question(question) for question in questions]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get question by ID.

    Returns question data in the public response schema.
    Requires authentication and appropriate permissions.

    Returns:
        QuestionResponse: Question data

    Raises:
        HTTPException: If question not found
    """
    service = QuestionService(db)
    question = await service.get_question_by_id(question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    return service.serialize_question(question)


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Update question.

    Updates an existing question in the question bank.
    Requires authentication and appropriate permissions.

    Returns:
        QuestionResponse: Updated question

    Raises:
        HTTPException: If question not found or unauthorized
    """
    service = QuestionService(db)
    try:
        updated_question = await service.update_question(question_id, question_update)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return service.serialize_question(updated_question)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Delete question.

    Soft deletes a question from the question bank.
    Requires authentication and appropriate permissions.

    Raises:
        HTTPException: If question not found or unauthorized
    """
    service = QuestionService(db)
    try:
        await service.delete_question(question_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return None
