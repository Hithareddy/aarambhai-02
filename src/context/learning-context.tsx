import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type PageType = "dashboard" | "learn" | "lesson" | "practice" | "assessment" | "game" | "other";
export type AnswerStatus = "unanswered" | "correct" | "incorrect";

export interface LearningContextState {
  pageType: PageType;
  assessmentMode: boolean;
  moduleId: string | null;
  moduleTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  skill: string | null;
  activityId: string | null;
  activityType: string | null;
  activityTitle: string | null;
  displayedContent: string | null;
  questionId: string | null;
  questionType: string | null;
  difficulty: number | null;
  learnerAnswer: string | null;
  correctAnswer: string | null;
  answerStatus: AnswerStatus;
}

export interface LearningContextType {
  state: LearningContextState;
  setPageType: (pageType: PageType) => void;
  setAssessmentMode: (assessmentMode: boolean) => void;
  setLessonContext: (
    context: Partial<
      Pick<
        LearningContextState,
        | "moduleId"
        | "moduleTitle"
        | "lessonId"
        | "lessonTitle"
        | "skill"
        | "activityId"
        | "activityType"
        | "activityTitle"
        | "displayedContent"
      >
    >
  ) => void;
  updateQuestionContext: (
    context: Partial<
      Pick<
        LearningContextState,
        | "questionId"
        | "questionType"
        | "displayedContent"
        | "difficulty"
        | "learnerAnswer"
        | "correctAnswer"
        | "answerStatus"
      >
    >
  ) => void;
  clearLearningContext: () => void;
}

const initialLearningState: LearningContextState = {
  pageType: "other",
  assessmentMode: false,
  moduleId: null,
  moduleTitle: null,
  lessonId: null,
  lessonTitle: null,
  skill: null,
  activityId: null,
  activityType: null,
  activityTitle: null,
  displayedContent: null,
  questionId: null,
  questionType: null,
  difficulty: null,
  learnerAnswer: null,
  correctAnswer: null,
  answerStatus: "unanswered",
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LearningContextState>(initialLearningState);

  const setPageType = useCallback((pageType: PageType) => {
    setState((prev) => (prev.pageType === pageType ? prev : { ...prev, pageType }));
  }, []);

  const setAssessmentMode = useCallback((assessmentMode: boolean) => {
    setState((prev) => (prev.assessmentMode === assessmentMode ? prev : { ...prev, assessmentMode }));
  }, []);

  const setLessonContext = useCallback(
    (
      context: Partial<
        Pick<
          LearningContextState,
          | "moduleId"
          | "moduleTitle"
          | "lessonId"
          | "lessonTitle"
          | "skill"
          | "activityId"
          | "activityType"
          | "activityTitle"
          | "displayedContent"
        >
      >
    ) => {
      setState((prev) => ({
        ...prev,
        ...context,
      }));
    },
    []
  );

  const updateQuestionContext = useCallback(
    (
      context: Partial<
        Pick<
          LearningContextState,
          | "questionId"
          | "questionType"
          | "displayedContent"
          | "difficulty"
          | "learnerAnswer"
          | "correctAnswer"
          | "answerStatus"
        >
      >
    ) => {
      setState((prev) => ({
        ...prev,
        ...context,
      }));
    },
    []
  );

  const clearLearningContext = useCallback(() => {
    setState((prev) => ({
      ...initialLearningState,
      pageType: prev.pageType,
      assessmentMode: false,
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setPageType,
      setAssessmentMode,
      setLessonContext,
      updateQuestionContext,
      clearLearningContext,
    }),
    [state, setPageType, setAssessmentMode, setLessonContext, updateQuestionContext, clearLearningContext]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
};

export function useLearningContext(): LearningContextType {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error("useLearningContext must be used within a LearningContextProvider");
  }
  return context;
}
