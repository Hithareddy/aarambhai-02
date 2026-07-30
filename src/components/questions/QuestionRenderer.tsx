import React from 'react';
import type { BankQuestion } from '@/data/assessmentQuestionBank';
import { ImageIdentificationQuestion } from './ImageIdentificationQuestion';
import { ImageSelectionQuestion } from './ImageSelectionQuestion';
import { MatchQuestion } from './MatchQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { ArrangeQuestion } from './ArrangeQuestion';
import { ArrangeLettersQuestion } from './ArrangeLettersQuestion';
import { ListeningImageQuestion } from './ListeningImageQuestion';
import { SpeakingRecordQuestion } from './SpeakingRecordQuestion';
import { ReadingScenarioQuestion } from './ReadingScenarioQuestion';
import { EverydayScenarioQuestion } from './EverydayScenarioQuestion';
import { OddOneOutQuestion } from './OddOneOutQuestion';
import { CategorizationQuestion } from './CategorizationQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';
import { MCQQuestion } from './MCQQuestion';

interface QuestionRendererProps {
  question: any;
  selected: any;
  onSelect: (val: any) => void;
  submitting?: boolean;
}

export function QuestionRenderer({
  question,
  selected,
  onSelect,
  submitting = false,
}: QuestionRendererProps) {
  if (!question) return null;

  const qType = question.type || question.question_type || 'mcq';
  const promptText = question.questionText || question.prompt || (question.question_content ? (typeof question.question_content === 'string' ? JSON.parse(question.question_content).text : question.question_content.text) : '');
  const imageSrc = question.image || question.image_url;
  const audioText = question.audioText || question.audio_script;

  const qContent = question.question_content && typeof question.question_content === 'object' ? question.question_content : {};
  const matchingPairs = question.matchingPairs || qContent.matchingPairs;
  const categorizationBuckets = question.categorizationBuckets || qContent.categorizationBuckets;
  const scrambledLetters = question.scrambledLetters || qContent.scrambledLetters;
  const scrambledWords = question.scrambledWords || qContent.scrambledWords;
  const targetWord = question.targetWord || qContent.targetWord;

  // TYPE 1: Image Identification (1 Large Image + 4 Text Cards)
  if ((qType === 'picture_id' || qType === 'fruit_id' || qType === 'vegetable_id' || qType === 'bird_id' || qType === 'vehicle_id' || qType === 'object_id' || qType === 'color_id') && imageSrc && question.options?.every((o: any) => !o.image)) {
    return (
      <ImageIdentificationQuestion
        questionText={promptText}
        image={imageSrc}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 2: Select the Correct Picture (4 LARGE IMAGE CARDS)
  if (qType === 'image_select' || (question.options && question.options.some((o: any) => o.image))) {
    return (
      <ImageSelectionQuestion
        questionText={promptText}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 3: Interactive Matching
  if (qType === 'matching' && matchingPairs) {
    const formattedOptions = matchingPairs.map((pair: any) => ({
      id: `${pair.left}-${pair.right}`,
      left: pair.left,
      right: pair.right,
      rightImage: pair.rightImage,
    }));

    return (
      <MatchQuestion
        prompt={promptText}
        options={formattedOptions}
        selected={selected || []}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 4: Arrange Words
  if (qType === 'arrange_words' || qType === 'arrange') {
    const scrambled = scrambledWords || (Array.isArray(question.options) ? question.options.map((o: any) => typeof o === 'string' ? o : o.text) : []);
    const optObj = scrambled.map((word: string, idx: number) => ({
      id: `w-${idx}`,
      text: word,
    }));

    return (
      <ArrangeQuestion
        prompt={promptText}
        options={optObj}
        selected={selected || []}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 5: Arrange Letters (Anagram)
  if (qType === 'arrange_letters' && scrambledLetters) {
    return (
      <ArrangeLettersQuestion
        questionText={promptText}
        scrambledLetters={scrambledLetters}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 6: Fill Blanks
  if (qType === 'fill_blank') {
    return (
      <FillBlankQuestion
        prompt={promptText}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 7: Listening (Audio Player + 4 Image Options)
  if (qType === 'listening_image' || qType === 'listening_mcq' || qType === 'listening') {
    return (
      <ListeningImageQuestion
        questionText={promptText}
        audioText={audioText || promptText}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 8: Speaking (Large Image + Big Microphone Recorder)
  if (qType === 'speaking') {
    return (
      <SpeakingRecordQuestion
        questionText={promptText}
        image={imageSrc}
        audioText={audioText}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 9: Reading Scenarios & Road Signs
  if (qType === 'read_select' || qType === 'read_sentence' || qType === 'road_signs') {
    return (
      <ReadingScenarioQuestion
        questionText={promptText}
        image={imageSrc}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // TYPE 10: Everyday Communication (Hospital, ATM, Bus Stop, Shop)
  if (qType === 'everyday_communication' || qType === 'shopping' || qType === 'bus_stand' || qType === 'atm' || qType === 'medicine_label' || qType === 'weather' || qType === 'time_clock') {
    return (
      <EverydayScenarioQuestion
        questionText={promptText}
        category={question.category || 'Everyday Life'}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // Odd One Out
  if (qType === 'odd_one_out') {
    return (
      <OddOneOutQuestion
        questionText={promptText}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // Categorization
  if (qType === 'categorization' && categorizationBuckets) {
    return (
      <CategorizationQuestion
        questionText={promptText}
        buckets={categorizationBuckets}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // True / False
  if (qType === 'true_false') {
    return (
      <TrueFalseQuestion
        prompt={promptText}
        options={question.options || []}
        selected={selected}
        onSelect={onSelect}
        submitting={submitting}
      />
    );
  }

  // Default MCQ
  return (
    <MCQQuestion
      prompt={promptText}
      options={question.options || []}
      selected={selected}
      onSelect={onSelect}
      submitting={submitting}
    />
  );
}
