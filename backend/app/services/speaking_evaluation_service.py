class SpeakingEvaluationService:
    """
    Validates recorded speaking attempts for the current MVP.

    Speech-to-text and pronunciation scoring require a configured provider and
    must not be fabricated when one is unavailable. The assessment records a
    completed speaking attempt, while the result screen remains honest about
    the evidence it has collected.
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
            
        Returns an accepted recording marker. No transcript or score is
        returned until a real speech provider is configured.
        """
        if not audio_bytes:
            raise ValueError("The recording is empty")
        return {"accepted": True}
