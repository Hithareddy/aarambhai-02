import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockProps } from "./types";
import { useLearningContext } from "@/context/learning-context";

export const QuizBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const { updateQuestionContext } = useLearningContext();

    const { question, options, correctAnswer, explanation } = block.content;

    React.useEffect(() => {
        updateQuestionContext({
            questionId: block.id,
            questionType: "quiz",
            displayedContent: question || null,
            correctAnswer: correctAnswer || null,
            learnerAnswer: null,
            answerStatus: "unanswered",
        });
    }, [block.id, question, correctAnswer, updateQuestionContext]);

    const handleSubmit = () => {
        if (!selectedId) return;
        setIsSubmitted(true);
        updateQuestionContext({
            learnerAnswer: selectedId,
            answerStatus: selectedId === correctAnswer ? "correct" : "incorrect",
        });
        if (onComplete) onComplete();
    };

    const isCorrect = selectedId === correctAnswer;

    return (
        <div className="mb-6 p-6 rounded-lg border bg-card shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-medium">{question}</h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Practice
                </span>
            </div>

            <div className="space-y-3 mb-6">
                {options?.map((opt: { id: string, text: string }) => {
                    const isSelected = selectedId === opt.id;
                    const isWinningOption = isSubmitted && opt.id === correctAnswer;
                    const isLosingOption = isSubmitted && isSelected && opt.id !== correctAnswer;

                    return (
                        <button
                            key={opt.id}
                            className={cn(
                                "w-full text-left p-4 rounded-md border-2 transition-all flex items-center justify-between group",
                                // Not submitted state
                                !isSubmitted && !isSelected && "border-input hover:border-primary/50 text-foreground",
                                !isSubmitted && isSelected && "border-primary bg-primary/5 text-primary",

                                // Submitted state
                                isSubmitted && isWinningOption && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium",
                                isSubmitted && isLosingOption && "border-destructive bg-destructive/10 text-destructive",
                                isSubmitted && !isWinningOption && !isLosingOption && "border-input/50 opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !isSubmitted && setSelectedId(opt.id)}
                            disabled={isSubmitted}
                        >
                            <span>{opt.text}</span>
                            {isSubmitted && isWinningOption && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                            {isSubmitted && isLosingOption && <XCircle className="h-5 w-5 text-destructive" />}
                        </button>
                    );
                })}
            </div>

            {!isSubmitted ? (
                <div className="flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedId}
                        className="w-full sm:w-auto"
                    >
                        Submit Answer
                    </Button>
                </div>
            ) : (
                <div className={cn(
                    "p-4 rounded-md border",
                    isCorrect ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50" : "bg-destructive/10 border-destructive/20"
                )}>
                    <h4 className={cn(
                        "font-semibold mb-1 flex items-center gap-2",
                        isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                    )}>
                        {isCorrect ? "Correct!" : "Not quite right."}
                    </h4>
                    {explanation && (
                        <p className="text-sm text-foreground/80 mt-2">{explanation}</p>
                    )}
                </div>
            )}
        </div>
    );
};
