import * as React from "react";
import type { BlockProps } from "./types";

export const FlashcardBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    const [flipped, setFlipped] = React.useState(false);

    return (
        <div className="mb-6 flex flex-col items-center">
            <div
                className="w-full max-w-sm h-64 perspective-1000 relative cursor-pointer group"
                onClick={() => {
                    setFlipped(!flipped);
                    if (!flipped && onComplete) onComplete(); // First flip marks complete
                }}
            >
                <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-card border-2 shadow-sm rounded-xl flex items-center justify-center p-6 text-center">
                        <span className="text-2xl font-bold">{block.content.front}</span>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-primary/5 border-2 border-primary/20 shadow-sm rounded-xl flex items-center justify-center p-6 text-center">
                        <span className="text-xl text-primary font-medium">{block.content.back}</span>
                    </div>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Tap to flip</p>
        </div>
    );
};
