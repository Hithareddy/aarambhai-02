import { useState } from "react";
import { Sprout, Volume2, BookOpen, CheckCircle2, Sparkles, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWordOfTheDay, useCheckSentence } from "@/lib/api/hooks";
import { MyWordsModal } from "./my-words-modal";
import { useLanguage } from "@/hooks/use-language";

export function WordOfTheDayCard() {
  const { t } = useLanguage();
  const { data: wordData, isLoading } = useWordOfTheDay();
  const checkSentenceMutation = useCheckSentence();

  const [inputSentence, setInputSentence] = useState("");
  const [feedback, setFeedback] = useState<{ is_valid: boolean; message: string } | null>(null);
  const [isMyWordsOpen, setIsMyWordsOpen] = useState(false);

  const handleSpeak = () => {
    if (wordData && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      utterance.lang =
        wordData.language === "hi" ? "hi-IN" : wordData.language === "te" ? "te-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSentence.trim() || checkSentenceMutation.isPending) return;

    checkSentenceMutation.mutate(
      { sentence: inputSentence.trim() },
      {
        onSuccess: (res) => {
          setFeedback({ is_valid: res.is_valid, message: res.feedback_message });
        },
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!wordData) return null;

  const isCompleted = wordData.is_completed;
  const learnerSentence = wordData.learner_sentence;

  return (
    <>
      <Card className="p-5 border border-border transition-all bg-gradient-to-br from-emerald-500/5 via-card to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/20">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sprout className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                {t("vocabulary.title")}
              </h3>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMyWordsOpen(true)}
            className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{t("vocabulary.myWordsBtn")}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="mt-3.5 space-y-3">
          {/* Target Word Header */}
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-black tracking-tight text-foreground uppercase">
              {wordData.word}
            </span>
            {wordData.phonetic && (
              <span className="text-xs font-mono text-muted-foreground">{wordData.phonetic}</span>
            )}
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Pronounce word"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          {/* Meaning */}
          <div className="space-y-1 text-xs">
            <p className="text-foreground/90 font-medium">
              <span className="text-muted-foreground font-semibold">{t("vocabulary.meaningLabel")} </span>
              {wordData.meaning_en}
            </p>
            {wordData.meaning_support && wordData.meaning_support !== wordData.meaning_en && (
              <p className="text-emerald-700 dark:text-emerald-300 font-medium italic">
                {wordData.meaning_support}
              </p>
            )}
          </div>

          {/* Example */}
          <div className="p-2.5 rounded-lg bg-muted/50 text-xs border border-border/40">
            <span className="font-semibold text-muted-foreground">{t("vocabulary.exampleLabel")} </span>
            <span className="italic text-foreground">"{wordData.example_sentence}"</span>
          </div>

          {/* Completion State OR Sentence Submission Form */}
          {isCompleted ? (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{t("vocabulary.wordLearnedToday")}</span>
              </div>
              {learnerSentence && (
                <p className="text-muted-foreground">
                  <span className="font-medium">{t("vocabulary.yourSentence")} </span>
                  <span className="italic text-foreground">"{learnerSentence}"</span>
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>{t("vocabulary.tryLabel", { word: wordData.word })}</span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={inputSentence}
                  onChange={(e) => setInputSentence(e.target.value)}
                  placeholder={t("vocabulary.inputPlaceholder", { word: wordData.word })}
                  className="h-9 text-xs"
                  disabled={checkSentenceMutation.isPending}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputSentence.trim() || checkSentenceMutation.isPending}
                  className="h-9 px-3 gap-1 text-xs shrink-0"
                >
                  {checkSentenceMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>{t("vocabulary.checkBtn")}</span>
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>

              {/* Validation Feedback Banner */}
              {feedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium border ${
                    feedback.is_valid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
            </form>
          )}
        </div>
      </Card>

      <MyWordsModal open={isMyWordsOpen} onOpenChange={setIsMyWordsOpen} />
    </>
  );
}
