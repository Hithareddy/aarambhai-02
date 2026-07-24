import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

interface CardFlipEngineProps {
    frontContent: React.ReactNode;
    backContent: React.ReactNode;
    isFlipped?: boolean;
    onFlipToggle?: (flipped: boolean) => void;
    disabled?: boolean;
    className?: string;
    width?: string;
    height?: string;
}

export function CardFlipEngine({
    frontContent,
    backContent,
    isFlipped: controlledFlipped,
    onFlipToggle,
    disabled = false,
    className,
    width = "w-64",
    height = "h-80"
}: CardFlipEngineProps) {
    const [internalFlipped, setInternalFlipped] = useState(false);

    const flipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const handleFlip = () => {
        if (disabled) return;
        const nextState = !flipped;
        setInternalFlipped(nextState);
        if (onFlipToggle) onFlipToggle(nextState);
    };

    return (
        <div
            className={cn("group perspective-[1000px] cursor-pointer", width, height, className)}
            onClick={handleFlip}
        >
            <div
                className={cn(
                    "relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
                    flipped ? "rotate-y-180" : ""
                )}
            >
                {/* Front Face */}
                <Card className="absolute w-full h-full backface-hidden bg-card/90 shadow-md hover:shadow-lg flex items-center justify-center p-4">
                    {frontContent}
                </Card>

                {/* Back Face */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-primary/5 border-primary/20 shadow-md flex items-center justify-center p-4">
                    {backContent}
                </Card>
            </div>
        </div>
    );
}
