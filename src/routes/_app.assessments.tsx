import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { QueryState, CardSkeleton } from "@/components/data-state";
import { getAssessmentHistory, type AssessmentResult } from "@/lib/api/assessment";
import { ClipboardCheck, RefreshCw, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/assessments")({
  head: () => ({ meta: [{ title: "Assessments — Aarambh AI" }] }),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const query = useQuery({
    queryKey: ["assessment-history"],
    queryFn: getAssessmentHistory,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessments"
        title="Check in, gently"
        description="Assessments help us shape your path. Never a pass or fail."
        actions={
          <Button asChild>
            <Link to="/assessment-quiz">Take initial assessment</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">Recommended</Badge>
          <h3 className="mt-3 font-display text-lg font-semibold">Initial adaptive check-in</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            About 5 minutes. Helps calibrate your learning path.
          </p>
          <Button asChild className="mt-4">
            <Link to="/assessment-quiz">Start</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <Badge variant="secondary">Practice</Badge>
          <h3 className="mt-3 font-display text-lg font-semibold">Weekly practice check</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick, low-pressure — see how well things are sticking.
          </p>
          <Button variant="outline" className="mt-4">
            Try a practice check
          </Button>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">History</h2>
        <div className="mt-4">
          <QueryState
            data={query.data}
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => query.refetch()}
            skeleton={
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            }
          >
            {(history) =>
              history.length === 0 ? (
                <EmptyState
                  icon={<ClipboardCheck className="h-5 w-5" />}
                  title="No assessments completed yet"
                  description="Complete your initial check-in to see history and detailed reports here."
                  action={
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/assessment-quiz">
                        <RefreshCw className="h-4 w-4" /> Start assessment
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {history.map((r) => (
                    <HistoryRow key={r.sessionId} result={r} />
                  ))}
                </ul>
              )
            }
          </QueryState>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ result }: { result: AssessmentResult }) {
  return (
    <li>
      <Card className="flex flex-wrap items-center gap-4 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Initial adaptive assessment</p>
          <p className="text-xs text-muted-foreground">
            {new Date(result.completedAt).toLocaleString()} · {result.totalQuestions} questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{result.overallLevel}</Badge>
          <Badge variant="outline">{Math.round(result.confidenceScore * 100)}% confidence</Badge>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/assessment-results" search={{ s: result.sessionId }}>
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Card>
    </li>
  );
}
