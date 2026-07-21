/**
 * ArrangeQuestion — Sentence arrangement renderer.
 *
 * HONEST RENDERING NOTICE:
 * The current backend seed data stores each arrangement option as a complete
 * pre-assembled phrase (e.g. "I/eat/an/apple/every/day"). This renderer
 * presents those options honestly as tile-styled buttons so the learner picks
 * the correct full ordering — NOT drag-and-drop reconstruction.
 *
 * Architecture note: This component is intentionally isolated. When the
 * backend evolves to provide individual word tokens (e.g. options: ["I",
 * "eat", "apple"]), replace only this component's internal render logic to
 * support interactive word placement. assessment-quiz.tsx needs no changes.
 *
 * Used by question_type: "arrange".
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface ArrangeQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

/** Renders a slash-delimited phrase as spaced word chips for readability. */
function PhraseChips({ text }: { text: string }) {
    const words = text.split("/").map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return <span>{text}</span>;
    return (
        <span className="flex flex-wrap gap-1">
            {words.map((word, i) => (
                <span
                    key={i}
                    className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium"
                >
                    {word}
                </span>
            ))}
        </span>
    );
}

export function ArrangeQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: ArrangeQuestionProps) {
    return (
        <div className="space-y-5">
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Arrange
                    </span>
                </div>
                <h2 className="text-xl font-semibold leading-snug">{prompt}</h2>
            </div>

            <p className="text-sm text-muted-foreground">
                Select the option that shows the correct word order:
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
                            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted/50"
                                }`}
                        >
                            <span
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border"
                                    }`}
                            >
                                {option.id}
                            </span>
                            <PhraseChips text={option.text} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
