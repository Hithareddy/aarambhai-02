import { Volume2, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyWords } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";

interface MyWordsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyWordsModal({ open, onOpenChange }: MyWordsModalProps) {
  const { t } = useLanguage();
  const { data: myWordsData, isLoading } = useMyWords();

  const handleSpeak = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{t("vocabulary.myWordsTitle")}</span>
            {myWordsData && (
              <Badge variant="secondary" className="ml-auto text-xs font-semibold">
                {t("vocabulary.learnedBadge", { count: String(myWordsData.total_count) })}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : !myWordsData || myWordsData.words.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">{t("vocabulary.noWordsYet")}</p>
              <p className="text-xs mt-1">{t("vocabulary.noWordsSub")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myWordsData.words.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display text-base font-bold text-foreground capitalize">
                        {item.word}
                      </span>
                      {item.phonetic && (
                        <span className="text-xs font-mono text-muted-foreground">{item.phonetic}</span>
                      )}
                      <button
                        onClick={() => handleSpeak(item.word, item.language)}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        title="Pronounce word"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>{item.learned_date}</span>
                    </div>
                  </div>

                  <div className="text-xs text-foreground/90 space-y-1">
                    <p><strong className="text-muted-foreground">{t("vocabulary.meaningLabel")}</strong> {item.meaning_en}</p>
                    {item.meaning_support && item.meaning_support !== item.meaning_en && (
                      <p className="text-muted-foreground italic font-sans">{item.meaning_support}</p>
                    )}
                  </div>

                  {item.learner_sentence && (
                    <div className="mt-2 pt-2 border-t border-border/40 text-xs bg-muted/40 p-2.5 rounded-lg flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground font-medium">{t("vocabulary.yourSentence")} </span>
                        <span className="italic text-foreground">"{item.learner_sentence}"</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
