import type { ContentBlock } from "@/lib/api/learning";

export interface BlockProps {
    block: ContentBlock;
    onComplete?: () => void;
}
