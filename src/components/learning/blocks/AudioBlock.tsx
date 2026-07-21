import * as React from "react";
import type { BlockProps } from "./types";

export const AudioBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    return (
        <div className="mb-6 p-4 rounded-lg border bg-card flex flex-col gap-3">
            {block.content.title && <h4 className="font-medium">{block.content.title}</h4>}
            {block.content.url ? (
                <audio
                    src={block.content.url}
                    controls
                    className="w-full"
                    onEnded={onComplete}
                />
            ) : (
                <div className="text-sm text-destructive">Audio URL not provided</div>
            )}
            {block.content.transcript && (
                <p className="text-sm text-muted-foreground mt-2 italic flex-1">
                    "{block.content.transcript}"
                </p>
            )}
        </div>
    );
};
