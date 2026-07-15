import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer } from "lucide-react";

export const Route = createFileRoute("/_app/practice")({
  head: () => ({ meta: [{ title: "Practice — Aarambh AI" }] }),
  component: PracticePage,
});

const packs = [
  { title: "Daily warm-up", difficulty: "Easy", min: 5, cat: "Mixed" },
  { title: "Listening drill", difficulty: "Easy", min: 8, cat: "Listening" },
  { title: "Reading aloud", difficulty: "Medium", min: 10, cat: "Speaking" },
  { title: "Vocabulary flashcards", difficulty: "Easy", min: 6, cat: "Vocabulary" },
  { title: "Grammar quick check", difficulty: "Medium", min: 12, cat: "Grammar" },
  { title: "Everyday conversations", difficulty: "Medium", min: 15, cat: "Speaking" },
];

function PracticePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Small doses, big progress"
        description="Short practice packs to keep what you've learned fresh."
      />

      <div className="flex flex-wrap gap-3">
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="listening">Listening</SelectItem>
            <SelectItem value="speaking">Speaking</SelectItem>
            <SelectItem value="grammar">Grammar</SelectItem>
            <SelectItem value="vocab">Vocabulary</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="any">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="anytime">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anytime">Any length</SelectItem>
            <SelectItem value="5">Under 5 min</SelectItem>
            <SelectItem value="10">Under 10 min</SelectItem>
            <SelectItem value="20">Under 20 min</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{p.cat}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> {p.min} min
              </span>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Difficulty: {p.difficulty}</p>
            <Button size="sm" className="mt-4 w-full">Start practice</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
