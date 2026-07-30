import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Plus, Edit2, Trash2, AlertCircle, Loader2, X, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/admin/announcements")({
  component: AdminAnnouncementsPage,
});

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAudience, setFormAudience] = useState("all");
  const [formActive, setFormActive] = useState(true);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const data = await apiRequest<AnnouncementRecord[]>("/admin/announcements");
      setAnnouncements(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormAudience("all");
    setFormActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (a: AnnouncementRecord) => {
    setEditingId(a.id);
    setFormTitle(a.title);
    setFormContent(a.content);
    setFormAudience(a.target_audience);
    setFormActive(a.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formTitle,
      content: formContent,
      target_audience: formAudience,
      is_active: formActive,
    };

    try {
      if (editingId) {
        await apiRequest(`/admin/announcements/${editingId}`, "PUT", payload);
      } else {
        await apiRequest("/admin/announcements", "POST", payload);
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      setError((err as Error).message || "Failed to save announcement.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/admin/announcements/${id}`, "DELETE");
      fetchAnnouncements();
    } catch (err) {
      setError((err as Error).message || "Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Broadcast System</span>
          <h1 className="text-3xl font-black text-foreground mt-1">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Publish system updates and alerts to the learner dashboard using real PostgreSQL persistence.</p>
        </div>

        <Button onClick={handleOpenAdd} className="rounded-2xl font-bold gap-2 self-start sm:self-auto h-11 shadow-md">
          <Plus className="h-5 w-5" />
          Create Announcement
        </Button>
      </div>

      <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold animate-pulse">Querying Database Announcements...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
              <h3 className="text-md font-bold">Query Error</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
              <Megaphone className="h-12 w-12 text-muted-foreground/45" />
              <p className="text-sm font-bold">No announcements created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Content Message</th>
                    <th className="px-6 py-4">Audience</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {announcements.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/5">
                      <td className="px-6 py-4 font-extrabold text-foreground">{a.title}</td>
                      <td className="px-6 py-4 max-w-sm truncate text-xs text-muted-foreground">{a.content}</td>
                      <td className="px-6 py-4 uppercase font-bold text-xs">{a.target_audience}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Badge variant={a.is_active ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                          a.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                        }`}>
                          {a.is_active ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button onClick={() => handleOpenEdit(a)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDelete(a.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-md rounded-3xl border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 px-6 py-5">
              <CardTitle className="text-lg font-black text-foreground">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Title</Label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required placeholder="e.g. System Maintenance Update" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Message Content</Label>
                  <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} required className="rounded-xl h-28" placeholder="Broadcast message..." />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold text-xs">Publish Announcement</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
