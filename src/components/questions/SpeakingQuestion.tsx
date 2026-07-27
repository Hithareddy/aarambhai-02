import { useState } from "react";
import { type Question } from "@/lib/api/assessment";
import { VoiceRecorderWidget } from "./VoiceRecorderWidget";
import { useLanguage } from "@/hooks/use-language";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export interface SpeakingQuestionProps {
    prompt: string;
    options: Question["options"];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting: boolean;
    question: Question;
}

export function SpeakingQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting,
    question,
}: SpeakingQuestionProps) {
    const { t } = useLanguage();

    // A completed recording is sufficient for the MVP placement flow. The
    // backend deliberately does not fabricate speech scores or transcripts.
    const [recordingAccepted, setRecordingAccepted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleRecordingComplete = async (blob: Blob) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            // Get current session from local storage to dispatch the evaluation
            // A more robust app might pull this from context, but we can read it off local storage matching startAssessmentSession
            const sessionId = localStorage.getItem("assessment_session_id");
            if (!sessionId) {
                throw new Error("No active assessment session found. Please refresh.");
            }

            // We must dynamically import the evaluateSpeech method to prevent circular loading if needed,
            // or we can just import it directly above.
            const { evaluateSpeech } = await import('@/lib/api/assessment');

            // Upload to the backend
            const result = await evaluateSpeech(sessionId, question.id, blob);

            if (!result.accepted) {
                throw new Error("The recording could not be saved. Please try again.");
            }
            setRecordingAccepted(true);

            // Dispatch to parent `onSelect` with a synthetic JSON string representing our speaking answer
            const dummySubmitValue = JSON.stringify({
                status: "spoken",
                selected_option: options[0]?.id || "speaking-completed"
            });

            setTimeout(() => {
                onSelect(dummySubmitValue);
            }, 750);

        } catch (err: any) {
            console.error("Audio upload failed:", err);
            setUploadError(err.message || "Failed to analyze speech. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-xl font-medium leading-relaxed" translate="yes">
                {prompt}
            </div>

            {question.reference_text && (
                <div className="bg-muted p-4 rounded-md border-l-4 border-l-primary/60 italic text-muted-foreground" translate="yes">
                    "{question.reference_text}"
                </div>
            )}

            {uploadError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
            )}

            {recordingAccepted ? (
                <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <div className="font-semibold mb-2">{t("assessmentQuiz.recordingSaved") || "Recording saved successfully."}</div>
                        <div className="text-xs text-muted-foreground mt-2 animate-pulse">Continuing automatically...</div>
                    </AlertDescription>
                </Alert>
            ) : (
                <VoiceRecorderWidget
                    maxDurationSeconds={question.max_duration_seconds}
                    onRecordingComplete={handleRecordingComplete}
                    disabled={submitting || isUploading}
                />
            )}
        </div>
    );
}
