import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  ListOrdered,
  Sparkles, 
  Loader2, 
  AlertCircle,
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/admin/modules")({
  component: AdminModulesPage,
});

interface LearningModuleRecord {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  difficulty: number;
  estimated_duration: number;
  order: number;
  is_active: boolean;
  lessons_count: number;
}

interface LessonRecord {
  id: string;
  module_id: string;
  title: string;
  lesson_type: string;
  content_blocks: any[];
  completion_criteria: any;
  order: number;
  status: string;
}

function AdminModulesPage() {
  const [modules, setModules] = useState<LearningModuleRecord[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Module Modal state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [formMId, setFormMId] = useState("");
  const [formMTitle, setFormMTitle] = useState("");
  const [formMDesc, setFormMDesc] = useState("");
  const [formMSkill, setFormMSkill] = useState("vocabulary");
  const [formMDifficulty, setFormMDifficulty] = useState("1");
  const [formMDuration, setFormMDuration] = useState("15");
  const [formMOrder, setFormMOrder] = useState("1");
  const [mError, setMError] = useState<string | null>(null);

  // Lesson Modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formLId, setFormLId] = useState("");
  const [formLTitle, setFormLTitle] = useState("");
  const [formLType, setFormLType] = useState("learning");
  const [formLOrder, setFormLOrder] = useState("1");
  const [formLBlocksJson, setFormLBlocksJson] = useState("[]");
  const [lError, setLError] = useState<string | null>(null);

  async function fetchModules() {
    setLoading(true);
    try {
      const data = await apiRequest<LearningModuleRecord[]>("/admin/modules");
      setModules(data);
      if (data.length > 0 && !selectedModuleId) {
        setSelectedModuleId(data[0].id);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load curriculum modules.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLessons(modId: string) {
    setLessonsLoading(true);
    try {
      const data = await apiRequest<LessonRecord[]>(`/admin/modules/${modId}/lessons`);
      setLessons(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load module lessons.");
    } finally {
      setLessonsLoading(false);
    }
  }

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModuleId) {
      fetchLessons(selectedModuleId);
    } else {
      setLessons([]);
    }
  }, [selectedModuleId]);

  // Module actions
  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setFormMId("module_" + Math.random().toString(36).substring(7));
    setFormMTitle("");
    setFormMDesc("");
    setFormMSkill("vocabulary");
    setFormMDifficulty("1");
    setFormMDuration("15");
    setFormMOrder("1");
    setMError(null);
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (m: LearningModuleRecord) => {
    setEditingModuleId(m.id);
    setFormMId(m.id);
    setFormMTitle(m.title);
    setFormMDesc(m.description || "");
    setFormMSkill(m.skill);
    setFormMDifficulty(String(m.difficulty));
    setFormMDuration(String(m.estimated_duration));
    setFormMOrder(String(m.order));
    setMError(null);
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMError(null);

    const payload = {
      id: formMId,
      title: formMTitle,
      description: formMDesc,
      skill: formMSkill,
      difficulty: parseInt(formMDifficulty),
      estimated_duration: parseInt(formMDuration),
      order: parseInt(formMOrder),
    };

    try {
      if (editingModuleId) {
        await apiRequest(`/admin/modules/${editingModuleId}`, "PUT", payload);
      } else {
        await apiRequest("/admin/modules", "POST", payload);
      }
      setModuleModalOpen(false);
      fetchModules();
    } catch (err) {
      setMError((err as Error).message || "Failed to save module.");
    }
  };

  const handleToggleModuleActive = async (m: LearningModuleRecord) => {
    try {
      await apiRequest(`/admin/modules/${m.id}`, "PUT", {
        is_active: !m.is_active
      });
      fetchModules();
    } catch (err) {
      setError((err as Error).message || "Failed to update module state.");
    }
  };

  // Lesson actions
  const handleOpenAddLesson = () => {
    if (!selectedModuleId) return;
    setEditingLessonId(null);
    setFormLId(selectedModuleId + "_lesson_" + (lessons.length + 1));
    setFormLTitle("");
    setFormLType("learning");
    setFormLOrder(String(lessons.length + 1));
    setFormLBlocksJson("[]");
    setLError(null);
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (l: LessonRecord) => {
    setEditingLessonId(l.id);
    setFormLId(l.id);
    setFormLTitle(l.title);
    setFormLType(l.lesson_type);
    setFormLOrder(String(l.order));
    setFormLBlocksJson(JSON.stringify(l.content_blocks, null, 2));
    setLError(null);
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLError(null);

    let blocksObj;
    try {
      blocksObj = JSON.parse(formLBlocksJson);
      if (!Array.isArray(blocksObj)) throw new Error();
    } catch {
      setLError("Content Blocks must be a valid JSON array.");
      return;
    }

    const payload = {
      id: formLId,
      title: formLTitle,
      lesson_type: formLType,
      content_blocks: blocksObj,
      order: parseInt(formLOrder),
    };

    try {
      if (editingLessonId) {
        await apiRequest(`/admin/lessons/${editingLessonId}`, "PUT", payload);
      } else {
        await apiRequest(`/admin/modules/${selectedModuleId}/lessons`, "POST", payload);
      }
      setLessonModalOpen(false);
      if (selectedModuleId) fetchLessons(selectedModuleId);
    } catch (err) {
      setLError((err as Error).message || "Failed to save lesson.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Syllabus Architect</span>
          <h1 className="text-3xl font-black text-foreground mt-1">Learning Content & Curriculum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage modules, lessons, exercise order, and skill difficulty levels.</p>
        </div>

        <Button onClick={handleOpenAddModule} className="rounded-2xl font-bold gap-2 self-start sm:self-auto h-11 shadow-md">
          <Plus className="h-5 w-5" />
          Create Learning Module
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs font-bold animate-pulse">Querying Modules & Lessons Database...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
          <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
          <h3 className="text-md font-bold">Query Error</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Modules panel list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Modules / Chapters</h3>
            <div className="space-y-3">
              {modules.map((m) => {
                const isSelected = selectedModuleId === m.id;
                return (
                  <Card 
                    key={m.id} 
                    onClick={() => setSelectedModuleId(m.id)}
                    className={`rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/20 bg-card"
                    } ${!m.is_active ? "opacity-60" : ""}`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold rounded px-1.5 py-0.5">
                            {m.skill}
                          </Badge>
                          <h4 className="text-base font-extrabold text-foreground mt-1 leading-snug">{m.title}</h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenEditModule(m); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" aria-label="Edit module">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleToggleModuleActive(m); }} variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${m.is_active ? "hover:text-destructive" : "hover:text-emerald-500"}`} aria-label={m.is_active ? "Deactivate module" : "Activate module"}>
                            {m.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-2 border-t border-border/60">
                        <span className="flex items-center gap-1">
                          <ListOrdered className="h-3.5 w-3.5 text-primary" />
                          Priority Order: {m.order}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          {m.lessons_count} Lessons
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Lessons panel list */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Lessons in Selected Chapter</h3>
              {selectedModuleId && (
                <Button onClick={handleOpenAddLesson} variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 border-border">
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </Button>
              )}
            </div>

            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {lessonsLoading ? (
                  <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                    <p className="text-xs font-bold animate-pulse">Querying Lessons...</p>
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 text-center text-muted-foreground gap-2">
                    <BookOpen className="h-10 w-10 text-muted-foreground/45" />
                    <p className="text-sm font-bold">No lessons found inside this chapter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                          <th className="px-6 py-4">Lesson Title</th>
                          <th className="px-6 py-4">Lesson Format</th>
                          <th className="px-6 py-4">Priority Order</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {lessons.map((l) => (
                          <tr key={l.id} className="hover:bg-muted/5">
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-foreground leading-tight">{l.title}</p>
                              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">{l.id}</span>
                            </td>
                            <td className="px-6 py-4 capitalize font-semibold text-muted-foreground text-xs">
                              {l.lesson_type}
                            </td>
                            <td className="px-6 py-4 font-bold text-foreground">
                              Order {l.order}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button onClick={() => handleOpenEditLesson(l)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" aria-label="Edit lesson">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Module Edit/Add Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-md rounded-3xl border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 px-6 py-5">
              <CardTitle className="text-lg font-black text-foreground">
                {editingModuleId ? "Edit Module Settings" : "Create Learning Module"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setModuleModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveModule} className="space-y-4">
                {mError && (
                  <div className="p-3 border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{mError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Module Unique ID</Label>
                  <Input value={formMId} onChange={(e) => setFormMId(e.target.value)} required disabled={!!editingModuleId} placeholder="e.g. module_grammar_basics" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Title</Label>
                  <Input value={formMTitle} onChange={(e) => setFormMTitle(e.target.value)} required placeholder="e.g. Grammar Fundamentals" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Description</Label>
                  <Textarea value={formMDesc} onChange={(e) => setFormMDesc(e.target.value)} className="rounded-xl h-20" placeholder="Summary details..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Skill Focus</Label>
                    <Select value={formMSkill} onValueChange={setFormMSkill}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="listening">Listening</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Difficulty (1-5)</Label>
                    <Input type="number" min="1" max="5" value={formMDifficulty} onChange={(e) => setFormMDifficulty(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Est Duration (min)</Label>
                    <Input type="number" min="1" value={formMDuration} onChange={(e) => setFormMDuration(e.target.value)} required />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Order Priority</Label>
                    <Input type="number" min="1" value={formMOrder} onChange={(e) => setFormMOrder(e.target.value)} required />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setModuleModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold text-xs">Save Module Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson Edit/Add Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 px-6 py-5 shrink-0">
              <CardTitle className="text-lg font-black text-foreground">
                {editingLessonId ? "Edit Lesson Structure" : "Create Lesson"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setLessonModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              <form onSubmit={handleSaveLesson} className="space-y-4">
                {lError && (
                  <div className="p-3 border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{lError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Lesson Unique ID</Label>
                    <Input value={formLId} onChange={(e) => setFormLId(e.target.value)} required disabled={!!editingLessonId} placeholder="e.g. lesson_vocab_basics_1" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Lesson Title</Label>
                    <Input value={formLTitle} onChange={(e) => setFormLTitle(e.target.value)} required placeholder="e.g. Introduction to Nouns" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Lesson Type</Label>
                    <Select value={formLType} onValueChange={setFormLType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learning">Learning / Concept</SelectItem>
                        <SelectItem value="practice">Practice Activities</SelectItem>
                        <SelectItem value="quiz">Timeline Quiz</SelectItem>
                        <SelectItem value="pronunciation">Pronunciation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Order in Module</Label>
                    <Input type="number" min="1" value={formLOrder} onChange={(e) => setFormLOrder(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground font-mono">Content Blocks (JSON structure)</Label>
                  <Textarea
                    className="font-mono text-xs rounded-2xl h-64 border-border"
                    value={formLBlocksJson}
                    onChange={(e) => setFormLBlocksJson(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2 shrink-0">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setLessonModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold text-xs">Save Lesson Structure</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
