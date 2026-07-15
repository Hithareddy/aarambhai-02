import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Video, Download, Bookmark } from "lucide-react";

export const Route = createFileRoute("/_app/resources")({
  head: () => ({ meta: [{ title: "Resources — Aarambh AI" }] }),
  component: ResourcesPage,
});

const items = [
  { icon: FileText, title: "How to build a daily learning habit", kind: "Article", read: "5 min read" },
  { icon: Video, title: "Introduction to voice-first learning", kind: "Video", read: "4 min" },
  { icon: FileText, title: "A gentle guide to reading aloud", kind: "Article", read: "8 min read" },
  { icon: Download, title: "Practice worksheet: greetings", kind: "Download", read: "PDF" },
  { icon: Video, title: "Understanding your progress reports", kind: "Video", read: "6 min" },
  { icon: FileText, title: "How our assessments work", kind: "Article", read: "7 min read" },
];

function ResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resources"
        title="Guides & worksheets"
        description="Articles, videos and printable practice — free to explore."
      />

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search resources…" className="pl-9" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <Card key={r.title} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                    <r.icon className="h-4 w-4" />
                  </span>
                  <button aria-label="Save" className="text-muted-foreground hover:text-primary">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{r.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{r.kind}</Badge>
                  <span>{r.read}</span>
                </div>
                <Button size="sm" variant="ghost" className="mt-4 justify-start px-0">
                  Open →
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        {["articles", "videos", "downloads", "saved"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Filtered view coming soon.
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
