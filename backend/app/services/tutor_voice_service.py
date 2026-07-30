"""
TutorVoiceService — Phase 7C

Handles the STT → existing TutorService → TTS pipeline for voice conversations.

Security:
  - OPENAI_API_KEY is read from backend settings only.
  - Audio blobs are held in memory and discarded after transcription.
  - TTS audio bytes are cached briefly with a one-time token (in-memory dict);
    the token is validated on the /voice-audio/{token} endpoint and then deleted.
  - No raw audio is written to disk or stored in the database.

Multilingual / Code-Switching:
  - STT is called without a fixed `language` parameter so that mixed-language
    (code-switched) input is transcribed correctly (e.g. "Yesterday నేను market కి వెళ్లాను.").
  - A language hint is passed as a prompt to improve accuracy for the learner's
    target language while still allowing mixed content.
"""

import logging
import secrets
import time
from typing import Tuple, Dict

import httpx

from app.core.config import settings
from app.services.tutor_service import TutorService
from app.schemas.tutor import MessageResponse

logger = logging.getLogger(__name__)


# ── In-memory one-time audio token store ─────────────────────────────────────
# Maps token → (audio_bytes, content_type, expiry_timestamp)
# Entries are deleted on first retrieval or after TTL.
_AUDIO_TOKEN_TTL_SECONDS = 120  # 2-minute window to fetch the audio
_audio_cache: Dict[str, Tuple[bytes, str, float]] = {}


def store_audio_token(audio_bytes: bytes, content_type: str = "audio/mpeg") -> str:
    """Store TTS audio bytes under a one-time token. Returns the token."""
    _purge_expired_tokens()
    token = secrets.token_urlsafe(32)
    _audio_cache[token] = (audio_bytes, content_type, time.time() + _AUDIO_TOKEN_TTL_SECONDS)
    return token


def consume_audio_token(token: str) -> Tuple[bytes, str] | None:
    """Retrieve and delete audio bytes for a token. Returns None if invalid/expired."""
    _purge_expired_tokens()
    entry = _audio_cache.pop(token, None)
    if entry is None:
        return None
    audio_bytes, content_type, expiry = entry
    if time.time() > expiry:
        return None
    return audio_bytes, content_type


def _purge_expired_tokens() -> None:
    now = time.time()
    expired = [t for t, (_, _, exp) in _audio_cache.items() if now > exp]
    for t in expired:
        _audio_cache.pop(t, None)


# ── Voice service ─────────────────────────────────────────────────────────────

class TutorVoiceService:
    """
    Phase 7C voice pipeline.

    Steps for voice_chat():
      1. Validate audio size.
      2. Transcribe via OpenAI STT (gpt-4o-mini-transcribe or configured model).
      3. Call TutorService.chat() with the transcript — uses full Phase 7B
         personalization (TutorContextBuilder, LSRW, practice mode, My Words).
      4. Persist learner + tutor messages via TutorService (same TutorMessage table).
      5. Generate TTS audio via OpenAI TTS (gpt-4o-mini-tts or configured model).
      6. Store TTS bytes under a one-time token; return token to frontend.
      7. Frontend fetches /voice-audio/{token} to play the audio.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY.strip()
        self.stt_model = settings.OPENAI_STT_MODEL.strip() or "gpt-4o-mini-transcribe"
        self.tts_model = settings.OPENAI_TTS_MODEL.strip() or "gpt-4o-mini-tts"
        self.tts_voice = settings.OPENAI_TTS_VOICE.strip() or "coral"
        self.max_audio_bytes = settings.OPENAI_VOICE_MAX_AUDIO_MB * 1024 * 1024

    def _check_api_key(self) -> None:
        if not self.api_key:
            raise ValueError(
                "Voice Tutor is offline: OPENAI_API_KEY is not configured in backend settings."
            )

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language_hint: str = "",
    ) -> str:
        """
        Transcribe audio bytes using OpenAI STT.

        language_hint: learner's target language code (e.g. 'en', 'te', 'hi').
          Passed as a prompt hint rather than a strict language lock so that
          code-switched / mixed-language speech is still transcribed correctly.

        Returns the transcript string.
        """
        self._check_api_key()

        if len(audio_bytes) > self.max_audio_bytes:
            raise ValueError(
                f"Audio exceeds maximum allowed size of {settings.OPENAI_VOICE_MAX_AUDIO_MB} MB."
            )

        # Build a language hint prompt so Whisper/gpt-4o-mini-transcribe
        # leans toward the target language without rejecting mixed content.
        prompt = ""
        if language_hint:
            prompt = f"The speaker is learning {language_hint}. Transcribe exactly as spoken."

        # Determine a safe filename extension for the OpenAI API
        ext = "webm"
        if "mp4" in content_type or filename.endswith(".mp4") or filename.endswith(".m4a"):
            ext = "mp4"
        elif "ogg" in content_type:
            ext = "ogg"
        elif "wav" in content_type:
            ext = "wav"

        safe_filename = f"voice_input.{ext}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=headers,
                    files={
                        "file": (safe_filename, audio_bytes, content_type),
                    },
                    data={
                        "model": self.stt_model,
                        "response_format": "text",
                        **({"prompt": prompt} if prompt else {}),
                    },
                )
                if response.status_code != 200:
                    logger.error(
                        f"OpenAI STT error {response.status_code}: {response.text[:300]}"
                    )
                    raise RuntimeError(
                        f"Speech transcription failed (status {response.status_code}). "
                        "Please try again or switch to text mode."
                    )

                transcript = response.text.strip()
                if not transcript:
                    raise RuntimeError(
                        "No speech detected in your recording. "
                        "Please speak clearly and try again."
                    )
                logger.info(
                    f"Transcription complete | model={self.stt_model} | "
                    f"chars={len(transcript)} | hint_lang={language_hint!r}"
                )
                return transcript

            except httpx.TimeoutException:
                logger.error("OpenAI STT request timed out.")
                raise RuntimeError(
                    "Transcription timed out. Please try a shorter recording or switch to text mode."
                )
            except httpx.RequestError as exc:
                logger.error(f"Network error reaching OpenAI STT: {exc}")
                raise RuntimeError(
                    "Cannot reach the transcription service. Please check your connection."
                )

    async def synthesize(self, text: str, voice_name: str | None = None, speed: float = 1.0) -> bytes:
        """
        Convert tutor reply text to speech using OpenAI TTS.
        Returns raw MP3 bytes.
        """
        self._check_api_key()

        # Truncate to a safe limit (TTS has a token ceiling)
        tts_text = text[:4000] if len(text) > 4000 else text

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.tts_model,
            "voice": voice_name if voice_name else self.tts_voice,
            "input": tts_text,
            "response_format": "mp3",
            "speed": speed,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers=headers,
                    json=payload,
                )
                if response.status_code != 200:
                    logger.error(
                        f"OpenAI TTS error {response.status_code}: {response.text[:300]}"
                    )
                    raise RuntimeError(
                        f"Speech synthesis failed (status {response.status_code})."
                    )
                logger.info(
                    f"TTS complete | model={self.tts_model} | voice={self.tts_voice} | "
                    f"input_chars={len(tts_text)} | audio_bytes={len(response.content)}"
                )
                return response.content

            except httpx.TimeoutException:
                logger.error("OpenAI TTS request timed out.")
                raise RuntimeError("Speech synthesis timed out.")
            except httpx.RequestError as exc:
                logger.error(f"Network error reaching OpenAI TTS: {exc}")
                raise RuntimeError("Cannot reach the speech synthesis service.")

    async def voice_chat(
        self,
        db,
        user_id: str,
        conversation_id: str,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        mode: str = "free_talk",
        mode_params: dict | None = None,
        voice_name: str | None = None,
        speed: float = 1.0,
    ) -> dict:
        """
        Full voice pipeline:
          audio_bytes → transcript → TutorService.chat() → TTS → one-time token

        Returns a dict with: transcript, user_message, tutor_reply, tutor_audio_token
        """
        # 1. Get learner profile for language hint
        tutor_svc = TutorService(db)
        profile = await tutor_svc.get_learner_profile(user_id)
        language_hint = profile.learning_language or ""

        # 2. STT — transcribe audio
        transcript = await self.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language_hint=language_hint,
        )

        # 3. Use existing TutorService.chat() for the full 7B personalized response.
        #    This calls TutorContextBuilder + TutorAIService + saves TutorMessage rows.
        user_msg, tutor_reply_msg = await tutor_svc.chat(
            user_id=user_id,
            conversation_id=conversation_id,
            message_text=transcript,
            mode=mode,
            mode_params=mode_params,
        )

        # 4. TTS — synthesize tutor reply
        try:
            audio_bytes_out = await self.synthesize(tutor_reply_msg.content, voice_name=voice_name, speed=speed)
            audio_token = store_audio_token(audio_bytes_out, content_type="audio/mpeg")
        except RuntimeError as tts_err:
            # TTS failure is non-fatal: conversation is saved, just no audio
            logger.warning(f"TTS synthesis failed (non-fatal): {tts_err}")
            audio_token = ""

        return {
            "transcript": transcript,
            "user_message": user_msg,
            "tutor_reply": tutor_reply_msg,
            "tutor_audio_token": audio_token,
        }
