/**
 * MCQQuestion — Standard multiple-choice renderer.
 *
 * Renders A/B/C/D lettered option buttons. Used by question_type: "mcq".
 * Also serves as the default fallback for unrecognised question types.
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface MCQQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

export function MCQQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: MCQQuestionProps) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold leading-snug">{prompt}</h2>
            <div className="grid gap-3">
                {options.map((option) => {
                    const isSelected = selected === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => onSelect(option.id)}
                            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted/50"
                                }`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border"
                                    }`}
                            >
                                {option.id}
                            </span>
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
