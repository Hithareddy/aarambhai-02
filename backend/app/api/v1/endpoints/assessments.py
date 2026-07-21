"""
Assessment endpoints.

Handles assessment blueprint generation, session management, and results.
Note: Business logic not implemented yet - structure only.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_active_user, get_db
from app.schemas.assessment import (
    AssessmentBlueprintCreate,
    AssessmentBlueprintResponse,
    AssessmentResultResponse,
    AssessmentSessionCreate,
    AssessmentSessionResponse,
    QuestionResponseCreate,
    QuestionResponseResponse,
)
from app.schemas.question import QuestionForAssessment
from app.services.assessment_service import AssessmentService

router = APIRouter()


@router.post("/blueprints", response_model=AssessmentBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def generate_assessment_blueprint(
    blueprint: AssessmentBlueprintCreate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Generate assessment blueprint.

    Creates a personalized assessment blueprint based on learner profile.
    This is the first step in starting an adaptive assessment.

    Returns:
        AssessmentBlueprintResponse: Generated blueprint
    """
    service = AssessmentService(db)
    try:
        blueprint_record = await service.generate_blueprint(blueprint, current_user.id)
        return AssessmentBlueprintResponse(
            id=str(blueprint_record.id),
            learning_goal=blueprint_record.learning_goal,
            question_count=blueprint_record.question_count,
            min_difficulty=blueprint_record.min_difficulty,
            max_difficulty=blueprint_record.max_difficulty,
            estimated_duration_minutes=blueprint_record.estimated_duration_minutes,
            domains=service._from_json(blueprint_record.domains) if blueprint_record.domains else [],
            skills=service._from_json(blueprint_record.skills) if blueprint_record.skills else [],
            question_distribution=service._from_json(blueprint_record.question_distribution) if blueprint_record.question_distribution else {},
            created_at=blueprint_record.created_at,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/sessions", response_model=AssessmentSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_assessment_session(
    session: AssessmentSessionCreate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Start an assessment session.

    Creates a new assessment session based on a blueprint.
    This initializes the adaptive assessment process.

    TODO: Implement session creation
    - Validate blueprint exists
    - Create session record
    - Initialize first question
    - Return session details

    Returns:
        AssessmentSessionResponse: Created session
    """
    service = AssessmentService(db)
    try:
        return await service.create_session(session, current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/sessions/{session_id}/next-question", response_model=QuestionForAssessment)
async def get_next_question(
    session_id: str,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get next question in assessment.

    Returns the next question based on adaptive algorithm.
    Adjusts difficulty based on previous responses.

    Returns:
        Question data for display

    Raises:
        HTTPException: If session not found or completed
    """
    service = AssessmentService(db)
    try:
        return await service.get_next_question(session_id, current_user.id)
    except ValueError as exc:
        message = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in message.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/sessions/{session_id}/responses", response_model=QuestionResponseResponse)
async def submit_question_response(
    session_id: str,
    response: QuestionResponseCreate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Submit question response.

    Records learner's response to a question and updates session state.

    Returns:
        QuestionResponseResponse: Recorded response with correctness
    """
    service = AssessmentService(db)
    try:
        return await service.submit_response(session_id, response, current_user.id)
    except ValueError as exc:
        message = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in message.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/sessions/{session_id}/complete", response_model=AssessmentResultResponse)
async def complete_assessment(
    session_id: str,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Complete assessment and generate results.

    Finalizes the assessment session and generates comprehensive results.

    Returns:
        AssessmentResultResponse: Complete assessment results
    """
    service = AssessmentService(db)
    try:
        return await service.complete_assessment(session_id, current_user.id)
    except ValueError as exc:
        message = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in message.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.get("/sessions/{session_id}/result", response_model=AssessmentResultResponse)
async def get_assessment_result(
    session_id: str,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get assessment result.

    Returns the complete result for a completed assessment session.

    Returns:
        AssessmentResultResponse: Assessment results
    """
    service = AssessmentService(db)
    try:
        result = await service.get_assessment_result(session_id, current_user.id)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment result not found"
            )
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        ) from exc


@router.get("/history")
async def get_assessment_history(
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get assessment history.

    Returns a list of all completed assessments for the current user.

    Returns:
        List of assessment results
    """
    service = AssessmentService(db)
    try:
        return await service.get_assessment_history(current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
