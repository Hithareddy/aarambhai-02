/**
 * FillBlankQuestion — Fill-in-the-blank renderer.
 *
 * Highlights the blank pattern (___) in the prompt, then renders standard
 * MCQ option buttons below. Used by question_type: "fill_blank".
 *
 * The blank is purely a visual cue derived from the prompt text; answer
 * selection is identical to MCQ (choose the option id).
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface FillBlankQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

/** Splits prompt on ___ and renders the blank as a styled inline span. */
function PromptWithBlank({ text }: { text: string }) {
    const BLANK_RE = /_{2,}/g;
    if (!BLANK_RE.test(text)) {
        return <span>{text}</span>;
    }

    const parts = text.split(/_{2,}/);
    return (
        <>
            {parts.map((part, i) => (
                <span key={i}>
                    {part}
                    {i < parts.length - 1 && (
                        <span className="mx-1 inline-block min-w-[4rem] border-b-2 border-primary px-1 text-center font-semibold text-primary">
                            ___
                        </span>
                    )}
                </span>
            ))}
        </>
    );
}

export function FillBlankQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: FillBlankQuestionProps) {
    return (
        <div className="space-y-5">
            <div className="rounded-lg bg-muted/40 px-5 py-4 text-lg font-medium leading-relaxed">
                <PromptWithBlank text={prompt} />
            </div>

            <p className="text-sm text-muted-foreground">
                Choose the word or phrase that correctly fills the blank:
            </p>

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
                            <span className="font-medium">{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
