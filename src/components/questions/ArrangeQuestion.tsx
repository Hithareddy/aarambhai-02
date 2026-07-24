/**
 * ArrangeQuestion — Interactive Sentence Arrangement
 *
 * Implements a word-chip selection engine that compiles an ordered array
 * of words based on learner clicks. Supports dynamic reset and validates
 * deeply against the backend array directly.
 */
import { useState, useEffect } from "react";
import type { QuestionOption } from "@/lib/api/assessment";
import { RefreshCcw, Hand } from "lucide-react";

export interface ArrangeQuestionProps {
    prompt: string;
    options: QuestionOption[]; // In backend, these should be individual words
    selected: any; // expected: string[]
    onSelect: (value: string[]) => void;
    submitting?: boolean;
}

export function ArrangeQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
}: ArrangeQuestionProps) {

    // We maintain internal state using the option IDs to support identical duplicate words.
    // E.g. two tokens both resolving to text "I".
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleWordClick = (optId: string) => {
        if (submitting) return;

        let newIds;
        if (selectedIds.includes(optId)) {
            // Remove it
            newIds = selectedIds.filter(id => id !== optId);
        } else {
            // Append it
            newIds = [...selectedIds, optId];
        }

        setSelectedIds(newIds);

        // Sync the text values back up to parent for the backend payload
        const finalPayload = newIds.map(id => {
            return options.find(o => o.id === id)?.text || "";
        });

        // The API only expects populated arrays so we sync appropriately
        onSelect(finalPayload);
    };

    const handleReset = () => {
        if (submitting) return;
        setSelectedIds([]);
        onSelect([]); // clear parent
    };

    const availableOptions = options.filter(opt => !selectedIds.includes(opt.id));
    const selectedOptions = selectedIds.map(id => options.find(o => o.id === id)!).filter(Boolean);

    // Override the prompt if it's an arrangement question with audio to hide the correct sentence.
    // The backend seed often includes the transcript in the prompt. We enforce the requested prompt:
    const displayPrompt = prompt.includes("Audio:") || prompt.includes("tts:")
        ? "🎧 Listen carefully. Arrange the words in the order you heard."
        : prompt;

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <Hand size={12} />
                        Arrange
                    </span>
                </div>
                <h2 className="text-xl font-semibold leading-snug">{displayPrompt}</h2>
            </div>

            <div className="space-y-4">
                {/* Your Sentence Area */}
                <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-5 min-h-[120px] flex flex-col relative transition-all">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/60 absolute top-3 left-4">
                        Your Sentence
                    </span>

                    {selectedOptions.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {selectedOptions.map(opt => (
                                <button
                                    key={`sel-${opt.id}`}
                                    onClick={() => handleWordClick(opt.id)}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-background border border-border rounded-md shadow-sm text-sm font-medium hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all active:scale-95"
                                >
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-8 flex items-center justify-center h-full text-muted-foreground/60 text-sm">
                            Click words below to build your sentence
                        </div>
                    )}

                    {selectedOptions.length > 0 && !submitting && (
                        <button
                            onClick={handleReset}
                            className="absolute bottom-3 right-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <RefreshCcw size={12} />
                            Reset
                        </button>
                    )}
                </div>

                {/* Available Words */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                        Available Words
                    </span>

                    <div className="flex flex-wrap gap-2">
                        {availableOptions.length > 0 ? (
                            availableOptions.map(opt => (
                                <button
                                    key={`avail-${opt.id}`}
                                    onClick={() => handleWordClick(opt.id)}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground border border-transparent rounded-md shadow-sm text-sm font-medium hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95"
                                >
                                    {opt.text}
                                </button>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground/50 py-2">
                                No words left
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
