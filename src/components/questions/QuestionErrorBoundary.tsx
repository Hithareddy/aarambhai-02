import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onSkipNext: () => void;
  questionId?: string;
}

interface State {
  hasError: boolean;
}

export class QuestionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[QuestionErrorBoundary] Caught rendering error on question ${this.props.questionId}:`, error, errorInfo);
    // Auto-advance to next valid question safely after brief delay
    setTimeout(() => {
      this.setState({ hasError: false });
      this.props.onSkipNext();
    }, 400);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2 animate-in fade-in duration-200">
          <span className="text-2xl">✨</span>
          <h4 className="font-extrabold text-sm text-foreground">Moving to next question...</h4>
          <p className="text-xs text-muted-foreground">Continuing assessment check-in smoothly.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
