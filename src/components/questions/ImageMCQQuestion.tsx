/**
 * ImageMCQQuestion — Image + multiple-choice renderer.
 *
 * Renders an image above the question prompt and MCQ options.
 * If image_url is null or absent (current state of the seeded DB), shows a
 * clearly-labeled placeholder box rather than silently omitting the image.
 *
 * Architecture note: When real image URLs are seeded, no code changes are
 * required here — the component automatically renders the image.
 *
 * Used by question_type: "image_mcq".
 */
import type { QuestionOption } from "@/lib/api/assessment";
import { ImageOff } from "lucide-react";

export interface ImageMCQQuestionProps {
    prompt: string;
    options: QuestionOption[];
    selected: string | null;
    onSelect: (id: string) => void;
    submitting?: boolean;
    /** URL for the image. May be null if not yet seeded in the database. */
    imageUrl?: string | null;
}

function ImageArea({ imageUrl }: { imageUrl?: string | null }) {
    if (imageUrl) {
        return (
            <div className="overflow-hidden rounded-lg border">
                <img
                    src={imageUrl}
                    alt="Question illustration"
                    className="w-full object-contain max-h-64"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-muted-foreground">
            <ImageOff size={32} className="opacity-50" />
            <span className="text-sm font-medium">Image not available</span>
            <span className="text-xs opacity-70">
                This question will display an image when media is added.
            </span>
        </div>
    );
}

export function ImageMCQQuestion({
    prompt,
    options,
    selected,
    onSelect,
    submitting = false,
    imageUrl,
}: ImageMCQQuestionProps) {
    return (
        <div className="space-y-5">
            <ImageArea imageUrl={imageUrl} />

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
