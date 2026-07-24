/**
 * QuestionRenderer — Central dispatcher for all question types.
 *
 * Routes each question to its dedicated renderer based on `question.question_type`.
 * Falls back to MCQQuestion for any unrecognised type.
 *
 * EXTENSIBILITY CONTRACT:
 * To add a new question type, you only need to:
 *   1. Create a renderer component in src/components/questions/
 *   2. Add a case to the RENDERERS map below
 *
 * No changes are required in assessment-quiz.tsx or anywhere else in the
 * assessment flow.
 */
import { type ReactElement, useState } from "react";
import type { Question } from "@/lib/api/assessment";
import { MCQQuestion } from "./MCQQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { ArrangeQuestion } from "./ArrangeQuestion";
import { MatchQuestion } from "./MatchQuestion";
import { ComprehensionQuestion } from "./ComprehensionQuestion";
import { ImageMCQQuestion } from "./ImageMCQQuestion";
import { SpeakingQuestion } from "./SpeakingQuestion";
import { AudioPlayerWidget } from "./AudioPlayerWidget";

export interface QuestionRendererProps {
    question: Question;
    selected: string | string[] | null;
    onSelect: (id: string | string[]) => void;
    submitting?: boolean;
}

/**
 * Registry of question_type → renderer.
 * All renderers share the same base props signature.
 */
type RendererProps = {
    prompt: string;
    options: Question["options"];
    selected: any; // We allow components to cast it back safely
    onSelect: (id: any) => void;
    submitting: boolean;
};

const RENDERERS: Record<
    string,
    (props: RendererProps & { question: Question }) => ReactElement
> = {
    mcq: ({ prompt, options, selected, onSelect, submitting }) => (
        <MCQQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    true_false: ({ prompt, options, selected, onSelect, submitting }) => (
        <TrueFalseQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    fill_blank: ({ prompt, options, selected, onSelect, submitting }) => (
        <FillBlankQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    arrange: ({ prompt, options, selected, onSelect, submitting }) => (
        <ArrangeQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    match: ({ prompt, options, selected, onSelect, submitting }) => (
        <MatchQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    comprehension: ({ prompt, options, selected, onSelect, submitting }) => (
        <ComprehensionQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
        />
    ),
    image_mcq: ({ prompt, options, selected, onSelect, submitting, question }) => (
        <ImageMCQQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
            imageUrl={(question as unknown as { image_url?: string | null }).image_url}
        />
    ),
    speaking: ({ prompt, options, selected, onSelect, submitting, question }) => (
        <SpeakingQuestion
            prompt={prompt}
            options={options}
            selected={selected}
            onSelect={onSelect}
            submitting={submitting}
            question={question}
        />
    ),
};

export function QuestionRenderer({
    question,
    selected,
    onSelect,
    submitting = false,
}: QuestionRendererProps) {
    const renderer = RENDERERS[question.question_type] ?? RENDERERS["mcq"];
    const [showTranscript, setShowTranscript] = useState(false);

    // If it's a listening question and the user hasn't answered yet, obfuscate the target sentence.
    // The target sentence is historically wrapped in single quotes in our seed data.
    let displayPrompt = question.prompt;
    if (question.audio_url && selected === null) {
        if (question.question_type !== 'arrange') {
            displayPrompt = displayPrompt.replace(/'.*?'/, '🔊 (Listen to audio)');
        } else {
            displayPrompt = "🎧 Listen carefully. Arrange the words in the order you heard.";
        }
    }

    const baseProps: RendererProps & { question: Question } = {
        prompt: displayPrompt,
        options: question.options,
        selected,
        onSelect,
        submitting,
        question,
    };

    return (
        <div className="space-y-6">
            {(question.audio_url || question.audio_script) && (
                <div className="flex flex-col gap-3">
                    <AudioPlayerWidget audioUrl={question.audio_url} audioScript={question.audio_script} />
                    {question.audio_script && selected !== null && (
                        <button
                            type="button"
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="text-xs text-muted-foreground hover:text-primary transition self-start underline"
                        >
                            {showTranscript ? "Hide Transcript" : "Show Transcript"}
                        </button>
                    )}
                    {showTranscript && selected !== null && (
                        <div className="text-sm p-4 bg-muted/20 border border-muted/30 rounded-md whitespace-pre-wrap">
                            {question.audio_script}
                        </div>
                    )}
                </div>
            )}
            {renderer(baseProps)}
        </div>
    );
}
