import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

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
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("practice.eyebrow") || "Practice"}
        title={t("practice.title") || "Small doses, big progress"}
        description={t("practice.description") || "Short practice packs to keep what you've learned fresh."}
      />

      <div className="flex flex-wrap gap-3">
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("practice.filterAllCats") || "All categories"}</SelectItem>
            <SelectItem value="listening">{t("practice.filterListening") || "Listening"}</SelectItem>
            <SelectItem value="speaking">{t("practice.filterSpeaking") || "Speaking"}</SelectItem>
            <SelectItem value="grammar">{t("practice.filterGrammar") || "Grammar"}</SelectItem>
            <SelectItem value="vocab">{t("practice.filterVocab") || "Vocabulary"}</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="any">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("practice.filterAnyDiff") || "Any difficulty"}</SelectItem>
            <SelectItem value="easy">{t("practice.filterEasy") || "Easy"}</SelectItem>
            <SelectItem value="medium">{t("practice.filterMedium") || "Medium"}</SelectItem>
            <SelectItem value="hard">{t("practice.filterHard") || "Hard"}</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="anytime">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anytime">{t("practice.filterAnyLength") || "Any length"}</SelectItem>
            <SelectItem value="5">{t("practice.filterUnder5") || "Under 5 min"}</SelectItem>
            <SelectItem value="10">{t("practice.filterUnder10") || "Under 10 min"}</SelectItem>
            <SelectItem value="20">{t("practice.filterUnder20") || "Under 20 min"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((p, idx) => (
          <Card key={p.title} className="p-5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{t(`practice.packs.${idx}.cat`) || p.cat}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> {p.min} {t("practice.minSuffix") || "min"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{t(`practice.packs.${idx}.title`) || p.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("practice.difficultyPrefix") || "Difficulty:"} {t(`practice.difficulty.${p.difficulty.toLowerCase()}`) || p.difficulty}</p>
            <Button size="sm" className="mt-4 w-full">{t("practice.btnStart") || "Start practice"}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
