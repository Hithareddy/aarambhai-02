import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Video,
  Download,
  Bookmark,
  Sparkles,
  BookOpen,
  PlayCircle,
  Printer,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  getResources,
  getRecommendedResources,
  toggleBookmarkResource,
  type ResourceItem,
} from "@/lib/api/resource";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/resources")({
  head: () => ({ meta: [{ title: "Curated Learning Library — Aarambh AI" }] }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [recommended, setRecommended] = useState<ResourceItem[]>([]);
  const [recReason, setRecReason] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resList, recData] = await Promise.all([
          getResources(activeTab === "saved" ? undefined : activeTab, searchTerm).catch(() => []),
          getRecommendedResources().catch(() => ({ resources: [], recommendation_reason: "", target_skill: "" })),
        ]);

        if (Array.isArray(resList)) setResources(resList);
        if (recData && recData.resources) {
          setRecommended(recData.resources);
          setRecReason(recData.recommendation_reason || "Tailored learning resources.");
        }
      } catch (err) {
        toast.error("Failed to load resource library.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab, searchTerm]);

  const handleToggleBookmark = async (r: ResourceItem) => {
    try {
      const res = await toggleBookmarkResource(r.id);
      const isNowBookmarked = res.status === "bookmarked";

      setResources((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, is_bookmarked: isNowBookmarked } : item))
      );

      if (isNowBookmarked) {
        toast.success("Saved to your personal resources!");
      } else {
        toast.info("Removed from saved resources.");
      }
    } catch (err) {
      toast.error("Could not update bookmark.");
    }
  };

  const handlePrintWorksheet = (r: ResourceItem) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${r.title} — Aarambh AI Printable</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
              h1 { font-size: 22px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
              pre, code, div { font-size: 14px; white-space: pre-wrap; }
              .header { margin-bottom: 20px; font-size: 12px; color: #666; }
              .footer { margin-top: 40px; font-size: 11px; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; color: #888; }
            </style>
          </head>
          <body>
            <div class="header">Aarambh AI — Personalized Learning Resource</div>
            <h1>${r.title}</h1>
            <p><strong>Category:</strong> ${r.category} | <strong>Target Skill:</strong> ${(r.recommended_skill || "General").toUpperCase()}</p>
            <hr />
            <div>${r.content || r.description}</div>
            <div class="footer">Aarambh AI Adaptive Platform • www.aarambh.ai</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredItems = resources.filter((item) => {
    if (activeTab === "saved") return item.is_bookmarked;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Educational Library"
        title="Curated Practice Guides & Resources"
        description="Bilingual cheat sheets, printable worksheets, and video tutorials synchronized with your diagnostic check-in."
      />

      {/* Recommended Banner */}
      {recommended.length > 0 && (
        <Card className="p-5 bg-gradient-to-r from-primary/10 via-card to-accent/10 border-primary/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                Personalized Recommendation
              </p>
              <h4 className="font-display text-sm font-bold text-foreground">{recReason}</h4>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 pt-1">
            {recommended.slice(0, 3).map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedResource(r)}
                className="p-3 rounded-xl bg-background/80 border border-border/80 hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{r.category} • {r.duration}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-primary">
                  <PlayCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search resources, cheat sheets, or video lessons…"
          className="pl-9 text-xs"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="article" className="text-xs">Articles</TabsTrigger>
          <TabsTrigger value="cheat_sheet" className="text-xs">Cheat Sheets</TabsTrigger>
          <TabsTrigger value="worksheet" className="text-xs">Worksheets & PDFs</TabsTrigger>
          <TabsTrigger value="video" className="text-xs">Videos</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[250px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((r) => (
                <Card key={r.id} className="flex flex-col justify-between p-5 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                        {r.type === "video" ? (
                          <Video className="h-4 w-4" />
                        ) : r.type === "worksheet" ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </span>
                      <button
                        onClick={() => handleToggleBookmark(r)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          r.is_bookmarked
                            ? "text-amber-500 fill-amber-500 bg-amber-500/10"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold leading-tight">{r.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                    <Badge variant="secondary" className="capitalize text-[10px]">{r.category}</Badge>
                    {r.type === "worksheet" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrintWorksheet(r)}
                        className="gap-1 text-primary p-0 h-auto font-medium text-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Printable View
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedResource(r)}
                        className="gap-1 text-primary p-0 h-auto font-medium text-xs"
                      >
                        <span>Open</span> →
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
              No resources found matching your search criteria.
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Resource Modal Reader / Video Viewer */}
      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedResource && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize font-mono text-[10px]">
                    {selectedResource.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedResource.duration}</span>
                  {selectedResource.video_channel && (
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedResource.video_channel}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold font-display">{selectedResource.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedResource.description}
                </DialogDescription>
              </DialogHeader>

              {/* Resource Content rendering */}
              {selectedResource.type === "video" && selectedResource.youtube_id ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedResource.youtube_id}`}
                    title={selectedResource.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : selectedResource.content ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm font-sans whitespace-pre-wrap leading-relaxed space-y-2">
                  {selectedResource.content}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                {selectedResource.content && (
                  <Button variant="outline" size="sm" onClick={() => handlePrintWorksheet(selectedResource)} className="gap-1.5 text-xs">
                    <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                  </Button>
                )}
                <Button size="sm" onClick={() => setSelectedResource(null)} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
