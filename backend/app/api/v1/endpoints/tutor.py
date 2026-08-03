from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.tutor import (
    TutorProfileResponse,
    UpdateTutorNameRequest,
    ConversationResponse,
    MessageResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    VoiceChatResponse,
)
from app.services.tutor_service import TutorService
from app.services.tutor_voice_service import TutorVoiceService, consume_audio_token

router = APIRouter()


@router.get("/profile", response_model=TutorProfileResponse)
async def get_tutor_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get learner's tutor profile and preferences.
    """
    service = TutorService(db)
    try:
        profile = await service.get_learner_profile(current_user.id)
        return TutorProfileResponse(
            tutor_name=profile.tutor_name or "Mira",
            learner_name=profile.name,
            learning_language=profile.learning_language,
            website_language=profile.website_language,
            current_familiarity=profile.current_familiarity,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/name", response_model=TutorProfileResponse)
async def update_tutor_name(
    request: UpdateTutorNameRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update learner's customized tutor name.
    """
    service = TutorService(db)
    try:
        new_name = await service.update_tutor_name(current_user.id, request.tutor_name)
        profile = await service.get_learner_profile(current_user.id)
        return TutorProfileResponse(
            tutor_name=new_name,
            learner_name=profile.name,
            learning_language=profile.learning_language,
            website_language=profile.website_language,
            current_familiarity=profile.current_familiarity,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all tutor conversation sessions for current learner.
    """
    service = TutorService(db)
    conversations = await service.get_learner_conversations(current_user.id)

    # Ensure at least one active conversation exists
    if not conversations:
        conv = await service.create_new_conversation(current_user.id)
        conversations = [conv]

    res = []
    for c in conversations:
        # Check if messages relationship is in inspect state / loaded without triggering lazy IO
        msg_count = 0
        if "messages" in c.__dict__ and c.__dict__["messages"]:
            msg_count = len(c.__dict__["messages"])
        res.append(
            ConversationResponse(
                id=c.id,
                tutor_name=c.tutor_name,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=msg_count,
            )
        )
    return res


@router.post("/conversations/new", response_model=ConversationResponse)
async def create_new_conversation(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a brand new conversation session with initial tutor greeting.
    """
    service = TutorService(db)
    conv = await service.create_new_conversation(current_user.id)
    return ConversationResponse(
        id=conv.id,
        tutor_name=conv.tutor_name,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=1,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all messages for a specific conversation session.
    """
    service = TutorService(db)
    messages = await service.get_conversation_messages(current_user.id, conversation_id)
    return [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/conversations/{conversation_id}/chat", response_model=ChatMessageResponse)
async def chat_with_tutor(
    conversation_id: str,
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send learner message and receive LLM tutor reply.
    """
    service = TutorService(db)
    try:
        user_msg, tutor_reply = await service.chat(
            user_id=current_user.id,
            conversation_id=conversation_id,
            message_text=request.message,
            mode=request.mode or "free_talk",
            mode_params=request.mode_params,
            screen_context=request.screen_context.model_dump() if request.screen_context else None,
        )
        return ChatMessageResponse(
            user_message=MessageResponse(
                id=user_msg.id,
                conversation_id=user_msg.conversation_id,
                role=user_msg.role,
                content=user_msg.content,
                created_at=user_msg.created_at,
            ),
            tutor_reply=MessageResponse(
                id=tutor_reply.id,
                conversation_id=tutor_reply.conversation_id,
                role=tutor_reply.role,
                content=tutor_reply.content,
                created_at=tutor_reply.created_at,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        # LLM network or API key error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
        )


# ── Phase 7C: Voice Chat ──────────────────────────────────────────────────────

ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/x-m4a",
    "video/webm",  # some browsers label webm recordings as video/webm
}


@router.post(
    "/conversations/{conversation_id}/voice",
    response_model=VoiceChatResponse,
    summary="Voice turn: STT → personalised Tutor → TTS",
)
async def voice_chat_with_tutor(
    conversation_id: str,
    audio_file: UploadFile = File(..., description="Learner voice recording (webm/mp4/wav)"),
    mode: str = Form("free_talk"),
    mode_params_json: str = Form("{}"),
    screen_context_json: str = Form("{}"),
    voice_gender: str = Form("female"),
    speaking_speed: float = Form(1.0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Voice conversation turn:
      1. Accept audio upload from authenticated learner.
      2. Validate MIME type and size.
      3. Transcribe via OpenAI STT (OPENAI_STT_MODEL).
      4. Send transcript through the existing personalized TutorService (Phase 7B).
      5. Persist learner + tutor TutorMessage rows (same table as text chat).
      6. Synthesize tutor reply via OpenAI TTS (OPENAI_TTS_MODEL).
      7. Return transcript, persisted messages, and a one-time audio token.

    The OPENAI_API_KEY never leaves the backend.
    Raw audio is read into memory and discarded immediately after transcription.
    """
    import json

    # Validate MIME type
    ct = (audio_file.content_type or "audio/webm").lower()
    if ct not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio type: {ct}. Please use webm, mp4, wav, or ogg.",
        )

    # Read audio into memory (size validated inside voice service)
    audio_bytes = await audio_file.read()

    # Parse optional mode_params & screen_context
    try:
        mode_params = json.loads(mode_params_json) if mode_params_json.strip() else {}
    except Exception:
        mode_params = {}

    try:
        screen_context = json.loads(screen_context_json) if screen_context_json.strip() else None
    except Exception:
        screen_context = None

    # Map voice gender
    voice_name = "coral" if voice_gender.lower() == "female" else "echo"

    voice_svc = TutorVoiceService()
    try:
        result = await voice_svc.voice_chat(
            db=db,
            user_id=current_user.id,
            conversation_id=conversation_id,
            audio_bytes=audio_bytes,
            filename=audio_file.filename or "voice_input",
            content_type=ct,
            mode=mode,
            mode_params=mode_params,
            voice_name=voice_name,
            speed=speaking_speed,
            screen_context=screen_context,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    user_msg = result["user_message"]
    tutor_msg = result["tutor_reply"]

    return VoiceChatResponse(
        transcript=result["transcript"],
        user_message=MessageResponse(
            id=user_msg.id,
            conversation_id=user_msg.conversation_id,
            role=user_msg.role,
            content=user_msg.content,
            created_at=user_msg.created_at,
        ),
        tutor_reply=MessageResponse(
            id=tutor_msg.id,
            conversation_id=tutor_msg.conversation_id,
            role=tutor_msg.role,
            content=tutor_msg.content,
            created_at=tutor_msg.created_at,
        ),
        tutor_audio_token=result["tutor_audio_token"],
        tutor_reply_text=tutor_msg.content,
    )


@router.get(
    "/voice-audio/{token}",
    summary="Fetch one-time TTS audio for a voice turn",
    response_class=Response,
)
async def get_voice_audio(
    token: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Stream the TTS MP3 for a completed voice turn.
    The token is single-use: consumed on first retrieval and then deleted.
    Expires automatically after 2 minutes if not fetched.
    """
    entry = consume_audio_token(token)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio not found or already played. Please request a new voice turn.",
        )
    audio_bytes, content_type = entry
    return Response(
        content=audio_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": "inline; filename=\"tutor_response.mp3\"",
            "Cache-Control": "no-store",
        },
    )
