import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Bookmark, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/learn")({
  head: () => ({ meta: [{ title: "Learn — Aarambh AI" }] }),
  component: LearnPage,
});

const courses = [
  { title: "Everyday English", cat: "Language", level: "Beginner", progress: 28 },
  { title: "Digital basics", cat: "Skills", level: "Beginner", progress: 12 },
  { title: "Introductory maths", cat: "Academics", level: "Foundational", progress: 0 },
  { title: "Voice reading practice", cat: "Reading", level: "Beginner", progress: 65 },
  { title: "Financial literacy", cat: "Life skills", level: "Intermediate", progress: 0 },
  { title: "Basic computer safety", cat: "Skills", level: "Beginner", progress: 0 },
];

function LearnPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn"
        title="Explore what to learn next"
        description="Browse recommended lessons or search across every topic."
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search lessons, topics or skills…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filters</Button>
          <Button variant="outline">Sort</Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.title} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{c.cat}</Badge>
                  <button aria-label="Save" className="text-muted-foreground hover:text-primary">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.level}</p>
                <div className="mt-4 flex-1">
                  <Progress value={c.progress} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">{c.progress}% complete</p>
                </div>
                <Button className="mt-4 w-full" size="sm">
                  {c.progress > 0 ? "Continue" : "Start"}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        {["language", "skills", "academics", "saved"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="grid place-items-center p-12 text-center">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="mt-3 font-display text-lg font-semibold">Recommendations coming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We're personalising this section based on what you tell us.
              </p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
