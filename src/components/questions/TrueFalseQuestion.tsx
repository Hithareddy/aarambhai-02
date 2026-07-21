/**
 * TrueFalseQuestion — Two-button True / False renderer.
 *
 * Renders the question prompt and exactly two large toggle buttons derived
 * from the options payload. Used by question_type: "true_false".
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface TrueFalseQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

export function TrueFalseQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: TrueFalseQuestionProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold leading-snug">{prompt}</h2>

            <div className="grid grid-cols-2 gap-4">
                {options.map((option) => {
                    const isSelected = selected === option.id;
                    const isTrue = option.text.toLowerCase().startsWith("true") ||
                        option.text.toLowerCase().startsWith("నిజం");

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => onSelect(option.id)}
                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-6 py-8 text-center font-semibold text-lg transition-all ${isSelected
                                    ? isTrue
                                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                        : "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                    : "border-border hover:bg-muted/50"
                                }`}
                        >
                            <span className="text-3xl">{isTrue ? "✓" : "✗"}</span>
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
