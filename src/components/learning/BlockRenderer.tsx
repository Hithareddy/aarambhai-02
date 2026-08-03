import * as React from "react";
import type { ContentBlock } from "@/lib/api/learning";
import {
    TextBlock,
    ImageBlock,
    AudioBlock,
    VocabularyBlock,
    PronunciationBlock,
    ConversationBlock,
    QuizBlock,
    FlashcardBlock,
    SentenceBuilderBlock,
    RecapBlock,
    VideoBlock,
    type BlockProps
} from "./blocks";

/**
 * Empty fallback renderer for unrecognized block types
 */
const FallbackBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    React.useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md mb-4 text-sm font-mono">
            Block type "{block.type}" is not supported yet by the BlockRenderer.
        </div>
    );
}

/**
 * The Block Registry
 */
const BLOCK_REGISTRY: Record<string, React.FC<BlockProps>> = {
    text: TextBlock,
    image: ImageBlock,
    video: VideoBlock,
    audio: AudioBlock,
    vocabulary: VocabularyBlock,
    pronunciation: PronunciationBlock,
    conversation: ConversationBlock,
    quiz: QuizBlock,
    flashcard: FlashcardBlock,
    sentence_builder: SentenceBuilderBlock,
    recap: RecapBlock,
};

interface BlockRendererProps {
    block: ContentBlock;
    onComplete?: () => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, onComplete }) => {
    const Component = BLOCK_REGISTRY[block.type] || FallbackBlock;
    return <Component block={block} onComplete={onComplete} />;
};
