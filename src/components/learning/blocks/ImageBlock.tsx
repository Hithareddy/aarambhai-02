import * as React from "react";
import type { BlockProps } from "./types";

export const ImageBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    // If an image block is just meant to be seen, we can auto-complete on mount, or after load
    React.useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="mb-6 rounded-lg overflow-hidden border shadow-sm flex flex-col items-center p-4 bg-muted/20">
            {block.content.url ? (
                <img
                    src={block.content.url}
                    alt={block.content.alt || "Lesson visual"}
                    className="max-w-full h-auto rounded-md"
                />
            ) : (
                <div className="w-full h-48 flex items-center justify-center bg-muted text-muted-foreground italic rounded-md">
                    Image Not Available
                </div>
            )}
            {block.content.caption && (
                <p className="mt-2 text-sm text-muted-foreground text-center">{block.content.caption}</p>
            )}
        </div>
    );
};
