import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { Bell, Trophy, BookOpen, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Aarambh AI" }] }),
  component: NotificationsPage,
});

const unread = [
  { icon: Trophy, title: "You earned a new badge!", desc: "First streak — 3 days in a row.", time: "2h ago" },
  { icon: BookOpen, title: "Your next lesson is ready", desc: "Numbers & counting, lesson 3.", time: "5h ago" },
];
const read = [
  { icon: Bell, title: "Welcome to Aarambh AI", desc: "Your learning journey has begun.", time: "Yesterday" },
];

function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Your quiet updates"
        description="Gentle reminders and celebrations — you're in control of what appears here."
        actions={
          <Button variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-2">
          {[...unread, ...read].map((n, i) => (
            <NotificationRow key={i} n={n} unread={i < unread.length} />
          ))}
        </TabsContent>
        <TabsContent value="unread" className="space-y-2">
          {unread.length ? (
            unread.map((n, i) => <NotificationRow key={i} n={n} unread />)
          ) : (
            <EmptyState icon={<Bell className="h-5 w-5" />} title="You're caught up" />
          )}
        </TabsContent>
        <TabsContent value="read" className="space-y-2">
          {read.map((n, i) => <NotificationRow key={i} n={n} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationRow({
  n,
  unread,
}: {
  n: { icon: typeof Bell; title: string; desc: string; time: string };
  unread?: boolean;
}) {
  return (
    <Card className={`flex items-start gap-3 p-4 ${unread ? "border-primary/30 bg-primary-soft/40" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <n.icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{n.title}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.desc}</p>
      </div>
      {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </Card>
  );
}
