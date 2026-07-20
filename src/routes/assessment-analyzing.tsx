import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { completeAssessment, getAssessmentResult } from "@/lib/api/assessment";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const searchSchema = z.object({ s: z.string().optional() });

const STEPS = [
  "Retrieving recorded placement responses...",
  "Evaluating Listening phonetic transcripts...",
  "Grading Reading comprehension markers...",
  "Analyzing Speaking speech quality indices...",
  "Measuring Writing response vocabulary density...",
  "Generating personal adaptive roadmap guides...",
];

export const Route = createFileRoute("/assessment-analyzing")({
  head: () => ({ meta: [{ title: "Analyzing Placement — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AnalyzingPage,
});

function AnalyzingPage() {
  const navigate = useNavigate();
  const { s } = Route.useSearch();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = s || localStorage.getItem("assessment_session_id");
    if (!sessionId) {
      navigate({ to: "/assessment-intro" });
      return;
    }

    let isMounted = true;
    let step = 0;

    const interval = setInterval(async () => {
      if (!isMounted) return;

      if (step < STEPS.length - 1) {
        step++;
        setCurrentStep(step);
      } else {
        clearInterval(interval);
        // Execute the actual calculation block
        try {
          await completeAssessment(sessionId);
          if (isMounted) {
            navigate({ to: "/assessment-results", search: { s: sessionId } });
          }
        } catch (err: unknown) {
          if (isMounted) {
            setErrorState((err as Error)?.message ?? "Failed to calculate placement outcomes.");
          }
        }
      }
    }, 450); // Fast enough to be responsive, slow enough to see the step names

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [s, navigate]);

  if (errorState) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Analysis error</h2>
          <p className="text-muted-foreground mb-6">{errorState}</p>
          <Button onClick={() => navigate({ to: "/assessment-intro" })}>
            Return to Setup
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Card className="max-w-lg w-full p-12 text-center">
        <Loader2
          className="animate-spin text-primary mx-auto mb-6"
          size={48}
          aria-hidden="true"
        />
        <h1 className="text-2xl font-semibold mb-2">Analyzing responses</h1>
        <p
          className="text-muted-foreground min-h-[24px] font-medium text-primary transition-all"
          aria-live="polite"
        >
          {STEPS[currentStep]}
        </p>

        {/* Step meter */}
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="mt-8 h-2" />
      </Card>
    </main>
  );
}
