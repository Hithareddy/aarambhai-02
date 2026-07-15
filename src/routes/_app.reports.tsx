import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Aarambh AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="What your learning is telling us"
        description="Gentle insights and recommendations — never judgement."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="font-display text-lg font-semibold">Strengths</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-success/15 text-success hover:bg-success/15">Great</Badge>
              <span>Reading comprehension is above target.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-success/15 text-success hover:bg-success/15">Great</Badge>
              <span>You're consistent 4 days a week on average.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            <h2 className="font-display text-lg font-semibold">Areas to nurture</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Grow</Badge>
              <span>Writing practice could use a few more sessions this week.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Grow</Badge>
              <span>Speaking confidence — try one voice practice a day.</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Recommendations</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Add one 10-minute writing session to your week.",
            "Try the voice reading practice pack — 6 minutes.",
            "Retake the initial assessment in 2 weeks.",
            "Bookmark one lesson to revisit for spaced practice.",
          ].map((r) => (
            <div key={r} className="rounded-xl border border-border bg-card/70 p-4 text-sm">
              {r}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
