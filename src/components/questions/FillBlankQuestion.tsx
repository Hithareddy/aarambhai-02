import type { QuestionOption } from "@/lib/api/assessment";

export interface FillBlankQuestionProps {
    prompt: string;
    stimulus?: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

/** Splits prompt/sentence on ___ and renders the blank as a styled inline span. */
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
                        <span className="mx-1.5 inline-block min-w-[4rem] border-b-2 border-primary px-2 text-center font-bold text-primary bg-primary/10 rounded">
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
    stimulus,
    options,
    selected,
    onSelect,
    submitting = false,
}: FillBlankQuestionProps) {
    const hasBlankInPrompt = /_{2,}/.test(prompt);
    const displayText = hasBlankInPrompt ? prompt : (stimulus || prompt);
    const headerText = hasBlankInPrompt ? "Fill in the missing word to complete the sentence:" : prompt;

    return (
        <div className="space-y-5">
            <h3 className="text-lg font-black text-foreground">
                {headerText}
            </h3>

            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-6 py-5 text-xl font-semibold leading-relaxed text-foreground shadow-sm">
                <PromptWithBlank text={displayText} />
            </div>

            <p className="text-sm font-medium text-muted-foreground">
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
                            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left font-bold transition-all shadow-sm ${isSelected
                                    ? "border-primary bg-primary/10 ring-4 ring-primary/20 text-foreground"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                                }`}
                        >
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border text-muted-foreground"
                                    }`}
                            >
                                {option.id}
                            </span>
                            <span className="text-base">{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
