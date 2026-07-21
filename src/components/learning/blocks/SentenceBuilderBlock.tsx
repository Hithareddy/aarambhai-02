import * as React from "react";
import type { BlockProps } from "./types";

export const SentenceBuilderBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    React.useEffect(() => {
        // Just for scaffolding, auto complete to not block testing
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="mb-6 p-6 rounded-lg border bg-card shadow-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Sentence Builder (Preview)</h3>
            <p className="text-muted-foreground italic mb-4">"{block.content.target_sentence}"</p>
            <div className="text-sm text-primary font-mono bg-primary/10 inline-block px-3 py-1 rounded">
                Sentence builder game mechanics pending Implementation.
            </div>
        </div>
    );
};
