import { useEffect, useState } from "react";
import type { WritingQuestion as WQ } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit3 } from "lucide-react";

interface Props {
  question: WQ;
  disabled?: boolean;
  onSubmit: (payload: { text: string; wordCount: number }) => void;
}

function countWords(s: string): number {
  const m = s.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function WritingQuestion({ question, disabled, onSubmit }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText("");
  }, [question.id]);

  const words = countWords(text);
  const met = words >= question.minWords;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-semibold mb-2">{question.instruction}</p>
        <p className="text-sm text-muted-foreground">
          Suggested length: at least <strong>{question.minWords}</strong> words.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing your response here..."
        rows={8}
        disabled={disabled}
        className={`min-h-[180px] text-base ${met ? "border-green-500" : ""}`}
      />

      <div className="flex items-center justify-between">
        <Badge variant={met ? "default" : "secondary"} className="gap-1">
          {met && <Edit3 size={12} />}
          {words} word{words === 1 ? "" : "s"}
          {met ? " (Target met)" : ` / ${question.minWords} words`}
        </Badge>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSubmit({ text: text.trim(), wordCount: words })}
          disabled={disabled || words === 0}
          size="lg"
        >
          Submit Response
        </Button>
      </div>
    </div>
  );
}
