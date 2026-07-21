import random

class SpeakingEvaluationService:
    """
    Abstracts Speech-to-Text and pronunciation evaluation logic.
    Provides a plug-and-play architecture for swapping between a local Mock evaluator
    and future transcription APIs like OpenAI Whisper, Google Cloud Speech, or Azure.
    """

    def __init__(self):
        # In a real app, you would initialize API clients (e.g., OpenAI()) here based on env vars
        pass

    async def evaluate(self, audio_bytes: bytes, reference_text: str | None, language_code: str) -> dict:
        """
        Takes raw audio bytes and evaluates them against the expected reference text.
        
        Args:
            audio_bytes: the raw bytes of the audio recording (webm, mp4, etc.)
            reference_text: the expected transcript 
            language_code: BCP-47 language code (e.g., en-IN)
            
        Returns:
            dict containing:
                - transcript (str)
                - pronunciation (int 0-100)
                - fluency (int 0-100)
                - completeness (int 0-100)
                - confidence (int 0-100)
        """
        # --- FUTURE IMPLEMENTATION (E.g. Whisper API) ---
        # 1. Transcribe audio -> actual_transcript
        # 2. Compare actual_transcript vs reference_text to calculate completeness
        # 3. Use Whisper confidence/logprobs to calculate pronunciation/fluency
        # ------------------------------------------------
        
        # --- MOCK MVP IMPLEMENTATION ---
        # Since we don't have Whisper enabled yet, we simulate an evaluation 
        # based on the reference text. We add slight variations to simulate imperfections.
        
        simulated_transcript = reference_text or ""
        
        if simulated_transcript and len(simulated_transcript) > 10:
            # Randomly lowercase a word or remove punctuation to simulate transcription variance
            words = simulated_transcript.split()
            if len(words) > 3:
                idx = random.randint(0, len(words) - 1)
                words[idx] = words[idx].lower().strip(".,!?")
                simulated_transcript = " ".join(words)
        
        # In the mock, assume the user mostly got it right
        pronunciation_score = random.randint(75, 98)
        fluency_score = random.randint(70, 95)
        completeness_score = 90 if reference_text else 0
        overall_confidence = (pronunciation_score + fluency_score) // 2

        return {
            "transcript": simulated_transcript or "[Mock STT: Audio recorded but no reference text provided]",
            "scores": {
                "pronunciation": pronunciation_score,
                "fluency": fluency_score,
                "completeness": completeness_score,
                "confidence": overall_confidence
            }
        }
