from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TutorProfileResponse(BaseModel):
    tutor_name: str
    learner_name: str
    learning_language: str
    website_language: str
    current_familiarity: str


class UpdateTutorNameRequest(BaseModel):
    tutor_name: str = Field(..., min_length=1, max_length=50, description="Name chosen for AI Tutor")


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    tutor_name: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0


from typing import List, Optional, Dict, Any

class ScreenContextSchema(BaseModel):
    page_type: Optional[str] = Field(None, max_length=50)
    assessment_mode: Optional[bool] = Field(False)
    module_id: Optional[str] = Field(None, max_length=100)
    module_title: Optional[str] = Field(None, max_length=200)
    lesson_id: Optional[str] = Field(None, max_length=100)
    lesson_title: Optional[str] = Field(None, max_length=200)
    skill: Optional[str] = Field(None, max_length=50)
    activity_id: Optional[str] = Field(None, max_length=100)
    activity_type: Optional[str] = Field(None, max_length=50)
    activity_title: Optional[str] = Field(None, max_length=200)
    displayed_content: Optional[str] = Field(None, max_length=500)
    question_id: Optional[str] = Field(None, max_length=100)
    question_type: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    learner_answer: Optional[str] = Field(None, max_length=500)
    correct_answer: Optional[str] = Field(None, max_length=500)
    answer_status: Optional[str] = Field(None, max_length=50)


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Learner message text")
    mode: Optional[str] = Field("free_talk", description="Practice mode: free_talk, role_play, fix_sentence, explain_lesson, quick_practice")
    mode_params: Optional[Dict[str, Any]] = Field(default=None, description="Optional parameters for specific practice mode")
    screen_context: Optional[ScreenContextSchema] = Field(default=None, description="Optional live learner screen context")


class ChatMessageResponse(BaseModel):
    user_message: MessageResponse
    tutor_reply: MessageResponse


class VoiceChatResponse(BaseModel):
    """
    Response from the voice-chat endpoint.
    The transcript (what the learner said) and tutor_text are returned as JSON.
    The actual TTS audio is streamed via a separate GET endpoint using tutor_audio_token.
    """
    transcript: str              # Whisper transcript of learner's speech
    user_message: MessageResponse
    tutor_reply: MessageResponse
    tutor_audio_token: str       # short-lived token to fetch /voice-audio/{token}
    tutor_reply_text: str        # tutor's text response
