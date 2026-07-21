import * as React from "react";
import type { BlockProps } from "./types";

export const RecapBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    React.useEffect(() => {
        // Recaps are generally just read, so autocall onComplete
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="mb-6 p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
            <h3 className="text-xl font-bold mb-4 text-primary">
                {block.content.title || "Lesson Recap"}
            </h3>
            <ul className="space-y-2 list-disc pl-5 marker:text-primary">
                {Array.isArray(block.content.points) ? (
                    block.content.points.map((point: string, idx: number) => (
                        <li key={idx} className="text-card-foreground">{point}</li>
                    ))
                ) : (
                    <li className="text-card-foreground">{block.content.summary}</li>
                )}
            </ul>
        </div>
    );
};
