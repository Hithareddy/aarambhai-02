import logging
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.tutor_context_builder import LearnerTutorContext

logger = logging.getLogger(__name__)


class TutorAIService:
    """
    Service for interacting with OpenAI LLM API for personalized language tutoring.
    Supports learner context, proficiency adaptation, LSRW focus, vocabulary reinforcement,
    and 5 practice modes.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower().strip() or "gemini"
        
        # OpenAI Config
        self.openai_key = settings.OPENAI_API_KEY.strip()
        self.openai_model = settings.OPENAI_TUTOR_MODEL.strip() or "gpt-4o-mini"
        self.openai_url = "https://api.openai.com/v1/chat/completions"
        
        # Gemini Config
        self.gemini_key = settings.GEMINI_API_KEY.strip()
        self.gemini_model = settings.GEMINI_TUTOR_MODEL.strip() or "gemini-1.5-flash"
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"

    async def generate_tutor_reply(
        self,
        tutor_name: str,
        context: LearnerTutorContext,
        messages_history: List[Dict[str, str]],
        mode: str = "free_talk",
        mode_params: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate a conversational tutor response using OpenAI Chat Completions based on learner context.
        """
        mode_params = mode_params or {}

        # 1. Level-specific guidelines
        level = (context.proficiency_level or "Beginner").lower()
        if "beginner" in level:
            level_instructions = (
                "- Adapt to BEGINNER level: Use short sentences and simple vocabulary.\n"
                "- Provide high guidance. If the learner struggles, offer gentle hints in their support language "
                f"({context.website_language})."
            )
        elif "intermediate" in level:
            level_instructions = (
                "- Adapt to INTERMEDIATE level: Use practical everyday vocabulary and moderate corrections.\n"
                f"- Speak mostly in target language ({context.learning_language}), offering support-language hints only when helpful."
            )
        else: # Advanced
            level_instructions = (
                "- Adapt to ADVANCED level: Use natural, rich vocabulary and fluent phrasing.\n"
                "- Keep explanations minimal and focus on natural conversation in target language."
            )

        # 2. LSRW Weakness adaptation
        weak_skill = context.weakest_skill or "speaking"
        skill_guidance = (
            f"- Learner focus area is {weak_skill.upper()}. Guide practice to encourage {weak_skill} "
            f"confidence naturally without explicitly stating 'Your weakest skill is {weak_skill}'."
        )

        # 3. Vocabulary reinforcement instruction
        words_prompt = ""
        if context.recent_words:
            word_list_str = ", ".join(f"'{w['word']}' ({w['meaning']})" for w in context.recent_words)
            words_prompt = (
                f"- Recently learned words by learner: [{word_list_str}].\n"
                "  If relevant, you can naturally reinforce one of these words in your response, but DO NOT force it artificially."
            )

        # 4. Current focus / lesson
        lesson_prompt = f"- Current Learning Focus/Lesson: {context.current_focus or 'General Communication'}"

        # 5. Practice Mode Directives
        if mode == "role_play":
            scenario = mode_params.get("scenario") or "restaurant"
            mode_instructions = (
                f"PRACTICE MODE: 🎭 ROLE PLAY (Scenario: {scenario.upper()}).\n"
                f"Act in character as a helpful person in a {scenario} setting. Prompt {context.learner_name} to respond in character in {context.learning_language}."
            )
        elif mode == "fix_sentence":
            mode_instructions = (
                "PRACTICE MODE: ✍️ FIX MY SENTENCE.\n"
                "The learner wants sentence correction. If they provided a sentence:\n"
                "1. Gently state the corrected version: 'Almost! 👍 Say: \"...\"'\n"
                "2. Briefly explain the correction in 1 simple sentence.\n"
                "3. Ask the learner to try using the corrected sentence or write another one."
            )
        elif mode == "explain_lesson":
            mode_instructions = (
                f"PRACTICE MODE: 📖 EXPLAIN MY LESSON.\n"
                f"The learner wants an explanation about their current lesson topic: '{context.current_focus}'.\n"
                "Explain the main concept simply in 2-3 clear sentences, then ask 1 check-for-understanding question."
            )
        elif mode == "quick_practice":
            mode_instructions = (
                f"PRACTICE MODE: ⚡ QUICK PRACTICE.\n"
                f"Generate a quick 1-question micro-practice targeting {context.learner_name}'s focus area ({weak_skill}). Keep it engaging and fast!"
            )
        else: # free_talk
            mode_instructions = (
                "PRACTICE MODE: 💬 FREE CONVERSATION.\n"
                "Engage in friendly open conversation. Keep responses short (2-3 sentences) and ask an engaging open question."
            )

        # Construct System Prompt
        system_prompt = (
            f"You are {tutor_name}, a friendly, patient, and encouraging personal language tutor for Aarambh AI.\n"
            f"Your goal is to help {context.learner_name} practice and build confidence in learning {context.learning_language}.\n\n"
            f"Learner Context:\n"
            f"- Learner Name: {context.learner_name}\n"
            f"- Target Learning Language: {context.learning_language}\n"
            f"- Support Language: {context.website_language}\n"
            f"- Proficiency Level: {context.proficiency_level}\n"
            f"- Learning Goal: {context.learning_goal}\n"
            f"{lesson_prompt}\n"
            f"{skill_guidance}\n"
            f"{words_prompt}\n\n"
            f"Level Adaptation:\n"
            f"{level_instructions}\n\n"
            f"{mode_instructions}\n\n"
            f"Pedagogical Guidelines:\n"
            f"1. Be warm, patient, and concise (keep replies to 2–4 sentences max).\n"
            f"2. For significant errors, offer gentle corrections (e.g. \"Almost! 👍 Try saying: '...'\") and ask a follow-up question.\n"
            f"3. Do NOT deliver long textbook lectures or overwhelm the learner.\n"
            f"4. Always output directly in conversational text without internal reasoning tags."
        )

        logger.info(f"Generating tutor response using provider: {self.provider}")

        if self.provider == "gemini":
            return await self._generate_gemini_reply(system_prompt, messages_history)
        else:
            return await self._generate_openai_reply(system_prompt, messages_history)

    async def _generate_gemini_reply(
        self,
        system_prompt: str,
        messages_history: List[Dict[str, str]],
    ) -> str:
        """
        Generate a reply using the Google Gemini API.
        """
        if not self.gemini_key:
            logger.warning("GEMINI_API_KEY is not set in backend settings.")
            raise ValueError(
                "AI Tutor is temporarily offline (GEMINI_API_KEY is not configured in backend settings)."
            )

        # Map learner to user, tutor/assistant to model
        contents = []
        for msg in messages_history:
            role = "user" if msg.get("role") == "learner" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("content", "")}]
            })

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 350
            }
        }

        headers = {
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.gemini_url, json=payload, headers=headers)
                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"Gemini API error {response.status_code}: {error_detail}")
                    if response.status_code == 429:
                        raise RuntimeError(
                            "AI Tutor is currently receiving too many requests. Please try again in a few moments."
                        )
                    elif response.status_code in (400, 401, 403):
                        raise RuntimeError(
                            "AI Tutor service configuration error. Please contact support."
                        )
                    raise RuntimeError(f"Gemini API returned status code {response.status_code}")

                data = response.json()
                candidates = data.get("candidates", [])
                if candidates and len(candidates) > 0:
                    candidate = candidates[0]
                    finish_reason = candidate.get("finishReason")
                    if finish_reason == "SAFETY":
                        raise RuntimeError("Response blocked by safety filters. Please try rephrasing.")
                    
                    content = candidate.get("content", {})
                    parts = content.get("parts", [])
                    if parts and len(parts) > 0:
                        reply_text = parts[0].get("text", "").strip()
                        if reply_text:
                            return reply_text

                raise RuntimeError("Empty response received from Gemini model candidates.")
            except httpx.TimeoutException:
                logger.error("Gemini API request timed out.")
                raise RuntimeError("AI Tutor request timed out. Please try again.")
            except httpx.RequestError as exc:
                logger.error(f"Network error connecting to Gemini API: {exc}")
                raise RuntimeError("Unable to reach AI provider network. Please check connection.")

    async def _generate_openai_reply(
        self,
        system_prompt: str,
        messages_history: List[Dict[str, str]],
    ) -> str:
        """
        Generate a reply using legacy/fallback OpenAI completions.
        """
        if not self.openai_key:
            logger.warning("OPENAI_API_KEY is not set in backend settings.")
            raise ValueError(
                "AI Tutor fallback is offline (OPENAI_API_KEY is not configured in backend settings)."
            )

        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages_history:
            role = "user" if msg.get("role") == "learner" else "assistant"
            formatted_messages.append({"role": role, "content": msg.get("content", "")})

        payload = {
            "model": self.openai_model,
            "messages": formatted_messages,
            "temperature": 0.7,
            "max_tokens": 250,
        }

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.openai_url, json=payload, headers=headers)
                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"OpenAI API error {response.status_code}: {error_detail}")
                    if response.status_code == 429:
                        raise RuntimeError(
                            "AI Tutor is currently receiving too many requests. Please try again in a few moments."
                        )
                    raise RuntimeError(f"OpenAI API returned status code {response.status_code}")

                data = response.json()
                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    reply_text = choices[0].get("message", {}).get("content", "").strip()
                    if reply_text:
                        return reply_text

                raise RuntimeError("Empty response received from OpenAI model choices.")
            except httpx.TimeoutException:
                logger.error("OpenAI API request timed out.")
                raise RuntimeError("AI Tutor request timed out. Please try again.")
            except httpx.RequestError as exc:
                logger.error(f"Network error connecting to OpenAI API: {exc}")
                raise RuntimeError("Unable to reach AI provider network. Please check connection.")
