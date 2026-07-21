/**
 * ComprehensionQuestion — Reading/listening comprehension renderer.
 *
 * Extracts the passage or dialogue from the prompt text (typically prefixed
 * with "Story:", "Dialogue:", or "Article:") and renders it in a styled
 * blockquote above the question and MCQ options.
 *
 * Used by question_type: "comprehension".
 */
import type { QuestionOption } from "@/lib/api/assessment";

export interface ComprehensionQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
}

/** Prefixes that introduce the passage text in the seed data. */
const PASSAGE_PREFIXES = [
    "Story:",
    "Dialogue:",
    "Article:",
    "Audio:",
    "Paragraph:",
];

/**
 * If the prompt starts with a known passage prefix, splits it into
 * (passage, question). Otherwise returns the full text as the question.
 */
function splitPrompt(text: string): { passage: string; question: string } {
    for (const prefix of PASSAGE_PREFIXES) {
        const lower = text.toLowerCase();
        if (lower.startsWith(prefix.toLowerCase())) {
            // Find the sentence boundary after the passage introduction.
            // The passage ends at the first ". " or ".' " followed by a capital letter.
            const afterPrefix = text.slice(prefix.length).trim();
            const sentenceEnd = afterPrefix.search(/\.\s+'?[A-Z]/);
            if (sentenceEnd !== -1) {
                return {
                    passage: afterPrefix.slice(0, sentenceEnd + 1).trim(),
                    question: afterPrefix.slice(sentenceEnd + 1).trim(),
                };
            }
            // Fallback: treat everything as the passage
            return { passage: afterPrefix, question: "" };
        }
    }
    return { passage: "", question: text };
}

export function ComprehensionQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: ComprehensionQuestionProps) {
    const { passage, question } = splitPrompt(prompt);

    return (
        <div className="space-y-5">
            {passage && (
                <blockquote className="rounded-lg border-l-4 border-primary/50 bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground italic">
                    {passage}
                </blockquote>
            )}

            <h2 className="text-xl font-semibold leading-snug">
                {question || prompt}
            </h2>

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
