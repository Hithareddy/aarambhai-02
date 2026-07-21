import * as React from "react";
import type { BlockProps } from "./types";

export const TextBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    React.useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="prose dark:prose-invert max-w-none mb-6">
            {block.content.heading && <h3 className="text-xl font-semibold mb-2">{block.content.heading}</h3>}
            {block.content.body && <p className="text-muted-foreground whitespace-pre-wrap">{block.content.body}</p>}
        </div>
    );
};
