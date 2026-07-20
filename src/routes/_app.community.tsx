import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Users, MessageCircle, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_app/community")({
  head: () => ({ meta: [{ title: "Community — Aarambh AI" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Learn alongside others"
        description="A kind, low-pressure space to ask, share, and grow together."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Discussions</h3>
          <p className="mt-1 text-sm text-muted-foreground">Chat with other learners.</p>
          <Button size="sm" variant="outline" className="mt-4" disabled>Coming soon</Button>
        </Card>
        <Card className="p-5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Ask a question</h3>
          <p className="mt-1 text-sm text-muted-foreground">No question is too small.</p>
          <Button size="sm" variant="outline" className="mt-4" disabled>Coming soon</Button>
        </Card>
        <Card className="p-5">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Learning groups</h3>
          <p className="mt-1 text-sm text-muted-foreground">Join small, focused groups.</p>
          <Button size="sm" variant="outline" className="mt-4" disabled>Coming soon</Button>
        </Card>
      </div>

      <EmptyState
        icon={<Users className="h-5 w-5" />}
        title="Community is opening soon"
        description="We're building a kind, learner-first community. You'll be invited from here when it's ready."
      />
    </div>
  );
}
