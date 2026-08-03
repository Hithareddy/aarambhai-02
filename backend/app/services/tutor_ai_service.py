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

        # 6. Live Screen Context
        screen_prompt = ""
        assessment_guardrail = ""

        if context.screen_context:
            sc = context.screen_context
            details = []
            if sc.get("page_type"):
                details.append(f"Page: {sc['page_type']}")
            if sc.get("module_title"):
                details.append(f"Module: {sc['module_title']}")
            if sc.get("lesson_title"):
                details.append(f"Lesson: {sc['lesson_title']}")
            if sc.get("skill"):
                details.append(f"Skill: {sc['skill']}")
            if sc.get("activity_title") or sc.get("activity_type"):
                details.append(f"Activity: {sc.get('activity_title') or sc.get('activity_type')}")
            if sc.get("displayed_content"):
                details.append(f"Currently Displayed Screen Content: \"{sc['displayed_content']}\"")
            if sc.get("question_id"):
                details.append(f"Question Type: {sc.get('question_type', 'quiz')}")
            if sc.get("learner_answer"):
                details.append(f"Learner Answer: \"{sc['learner_answer']}\"")
            if sc.get("answer_status") and sc.get("answer_status") != "unanswered":
                details.append(f"Answer Status: {sc['answer_status']}")

            if details:
                screen_prompt = (
                    "\n\n[LIVE_SCREEN_CONTEXT_START]\n"
                    "CURRENT LEARNING SCREEN (Live Context):\n"
                    + "\n".join(f"- {d}" for d in details)
                    + "\n[LIVE_SCREEN_CONTEXT_END]\n"
                    "Note: The learner can see this screen right now. When they say 'this', 'this question', "
                    "'this sentence', 'my answer', 'why is this wrong?', or 'what am I learning?', "
                    "refer directly to the current screen context above."
                )

            if sc.get("assessment_mode") is True:
                assessment_guardrail = (
                    "\n\n[ASSESSMENT_MODE_ACTIVE]\n"
                    "STRICT ASSESSMENT GUARDRAIL:\n"
                    "- The learner is currently taking an official diagnostic placement assessment.\n"
                    "- DO NOT reveal the correct answer or choose options for the learner.\n"
                    "- DO NOT solve assessment items, select correct multiple-choice letters, or provide step-by-step solutions that effectively answer the item.\n"
                    "- Offer ONLY general encouragement, clarify general assessment instructions, or suggest overall study strategy."
                )

        # 7. Demographic Persona Adaptation
        demo_details = []
        persona_instructions = ""
        if context.age_group:
            demo_details.append(f"Age Group: {context.age_group}")
            age_str = str(context.age_group).lower()
            if "12" in age_str or "child" in age_str or "kid" in age_str:
                persona_instructions = (
                    "PERSONA ADAPTATION (CHILD UNDER 12):\n"
                    "- Use very friendly, simple, playful, and encouraging language with emojis.\n"
                    "- Use relatable analogies (cartoons, school, games, toys).\n"
                    "- Give helpful hints instead of direct answers!"
                )
            elif "senior" in age_str or "60" in age_str or "65" in age_str:
                persona_instructions = (
                    "PERSONA ADAPTATION (SENIOR CITIZEN):\n"
                    "- Use respectful, patient, warm, and gentle phrasing.\n"
                    "- Speak clearly and explain concepts with everyday life examples.\n"
                    "- Offer step-by-step guidance without rushing."
                )
            elif "pro" in age_str or "working" in age_str or "18" in age_str or "college" in age_str:
                persona_instructions = (
                    "PERSONA ADAPTATION (COLLEGE / WORKING PROFESSIONAL):\n"
                    "- Use professional, structured, concise, and goal-oriented language.\n"
                    "- Focus on workplace, academic, and practical everyday communication."
                )

        if context.current_role:
            demo_details.append(f"Role/Context: {context.current_role}")
        if context.educational_background:
            demo_details.append(f"Education: {context.educational_background}")

        demo_prompt = ""
        if demo_details:
            demo_prompt = "- Learner Demographics: " + ", ".join(demo_details)

        # 8. Multilingual Support Directive
        multilingual_directive = ""
        if context.website_language != context.learning_language:
            multilingual_directive = (
                f"MULTILINGUAL INSTRUCTION:\n"
                f"- The learner's website UI language is '{context.website_language}' and target learning language is '{context.learning_language}'.\n"
                f"- Explain difficult grammar concepts, instructions, and hints in '{context.website_language}', while keeping target practice phrases in '{context.learning_language}'."
            )

        # Construct System Prompt
        system_prompt = (
            f"You are {tutor_name}, an intelligent, friendly, and patient personal language companion for Aarambh AI.\n"
            f"Your goal is to help {context.learner_name} master {context.learning_language}.\n\n"
            f"Learner Profile & Context:\n"
            f"- Learner Name: {context.learner_name}\n"
            f"- Target Learning Language: {context.learning_language}\n"
            f"- Website UI / Support Language: {context.website_language}\n"
            f"- Proficiency Level: {context.proficiency_level}\n"
            f"- CEFR Placement: {context.cefr_level or 'Developing'}\n"
            f"- Strengths: {', '.join(context.strengths) if context.strengths else 'General'}\n"
            f"- Weaknesses: {', '.join(context.weaknesses) if context.weaknesses else 'General'}\n"
            f"- Streak: {context.current_streak} Day(s) | Daily Goal: {context.daily_goal_minutes} mins\n"
            f"{demo_prompt}\n"
            f"{lesson_prompt}\n"
            f"{skill_guidance}\n"
            f"{words_prompt}\n"
            f"{screen_prompt}\n"
            f"{assessment_guardrail}\n\n"
            f"Level Adaptation:\n"
            f"{level_instructions}\n\n"
            f"{multilingual_directive}\n\n"
            f"{persona_instructions}\n\n"
            f"{mode_instructions}\n\n"
            f"Pedagogical Guidelines:\n"
            f"1. Be warm, patient, and concise (keep replies to 2–4 sentences max).\n"
            f"2. NEVER reveal direct answers for active assessment or game questions—give subtle hints!\n"
            f"3. For significant errors, offer gentle corrections (e.g. \"Almost! 👍 Try saying: '...'\") and ask a follow-up question.\n"
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

                # Graceful context fallback when LLM output is empty or filtered
                if context.website_language == "hi":
                    return f"बहुत बढ़िया, {context.learner_name}! अभ्यास जारी रखें। मैं आपकी सहायता के लिए यहाँ हूँ।"
                elif context.website_language == "te":
                    return f"చాలా బాగుంది, {context.learner_name}! అభ్యాసం కొనసాగించండి. నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
                return f"Great effort, {context.learner_name}! Keep practicing. I'm here to help you every step of the way!"
            except Exception as exc:
                logger.error(f"Gemini API request error: {exc}")
                if context.website_language == "hi":
                    return f"नमस्ते {context.learner_name}! चलिए {context.learning_language} सीखने का अभ्यास जारी रखते हैं।"
                elif context.website_language == "te":
                    return f"నమస్కారం {context.learner_name}! మనం {context.learning_language} అభ్యాసాన్ని కొనసాగిద్దాం."
                return f"Hello {context.learner_name}! Let's continue practicing your {context.learning_language} skills together!"

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
