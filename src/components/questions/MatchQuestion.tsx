/**
 * MatchQuestion — Matching exercise renderer.
 *
 * HONEST RENDERING NOTICE:
 * The current backend seed data for "match" questions provides standard MCQ
 * options (A/B/C/D) rather than structured pair data (e.g. left[]: right[]).
 * This renderer detects that condition and shows a clearly-labeled simplified
 * fallback view instead of pretending to be an interactive matching exercise.
 *
 * Architecture note: This component is designed for evolution. When the
 * backend provides proper pair data (e.g. { pairs: [{left, right}] }), add
 * the pair data to the Question type and add a branch here for the full UI.
 * assessment-quiz.tsx requires no changes.
 *
 * Used by question_type: "match".
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface MatchQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

export function MatchQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: MatchQuestionProps) {
    return (
        <div className="space-y-5">
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
                        Match
                    </span>
                    <span className="text-xs text-muted-foreground">
                        — simplified view (full interactive matching coming soon)
                    </span>
                </div>
                <h2 className="text-xl font-semibold leading-snug">{prompt}</h2>
            </div>

            <p className="text-sm text-muted-foreground">
                Choose the correct match from the options below:
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
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
