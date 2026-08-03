import * as React from "react";
import type { BlockProps } from "./types";
import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

export const VideoBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    React.useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    const content = block.content || {};
    const videoUrl = content.video_url || content.url || "";
    const title = content.title || "Supplementary Video Lesson";
    const description = content.description || "";

    // Extract YouTube embed ID if applicable
    let embedUrl = videoUrl;
    if (videoUrl && videoUrl.includes("youtube.com/watch?v=")) {
        const videoId = videoUrl.split("v=")[1]?.split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl && videoUrl.includes("youtu.be/")) {
        const videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    return (
        <Card className="p-4 mb-6 space-y-3 bg-card border border-border/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <PlayCircle className="h-4 w-4" />
                <span>{title}</span>
            </div>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {embedUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border/40 bg-black">
                    <iframe
                        src={embedUrl}
                        title={title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            ) : (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/40 rounded-lg">
                    Video URL unavailable. Proceeding with lesson notes.
                </div>
            )}
        </Card>
    );
};
