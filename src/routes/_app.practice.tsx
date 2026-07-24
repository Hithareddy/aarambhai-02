import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useTodaysLearning } from "@/lib/api/hooks";
import { ModuleRunner } from "@/components/learning/ModuleRunner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/practice")({
  head: () => ({ meta: [{ title: "Daily Practice — Aarambh AI" }] }),
  component: PracticePage,
});

function PracticePage() {
  const query = useTodaysLearning();
  const navigate = useNavigate();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load today's learning plan. Please try again later.
      </div>
    );
  }

  const activities = query.data?.activities || [];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Daily Practice"
        title={query.data?.module_context || "Your tailored sequence"}
        description={`${query.data?.estimated_time || "10 mins"} • ${query.data?.total_xp || 0} XP Potential`}
      />

      <ModuleRunner
        activities={activities}
        onFinish={() => {
          navigate({ to: "/dashboard" });
        }}
      />
    </div>
  );
}
