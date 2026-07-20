import { useEffect, useState } from "react";
import type { ReadingQuestion as RQ } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface Props {
  question: RQ;
  disabled?: boolean;
  onSubmit: (selectedIndex: number) => void;
}

export function ReadingQuestion({ question, disabled, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [question.id]);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-primary/10 border-primary/20">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-3">
          <BookOpen size={16} />
          Reading passage
        </div>
        <p className="text-lg leading-relaxed text-primary-foreground font-medium">
          {question.passage}
        </p>
      </Card>

      <p className="text-lg font-semibold">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => setSelected(i)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selected === i
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => selected != null && onSubmit(selected)}
          disabled={selected == null || disabled}
          size="lg"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
}
