import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  HelpCircle, 
  Search, 
  Plus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle, 
  Loader2,
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/admin/questions")({
  component: AdminQuestionsPage,
});

interface QuestionRecord {
  id: string;
  learning_goal: string;
  domain: string;
  skill: string;
  difficulty: number;
  question_type: string;
  language: string;
  question_content: any;
  options: any[];
  correct_answer: any;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
}

const TEMPLATES: Record<string, { content: any; options: any[]; correct: any }> = {
  mcq: {
    content: { text: "What does the word 'rapid' mean?" },
    options: [
      { id: "opt-1", text: "Very fast" },
      { id: "opt-2", text: "Very slow" },
      { id: "opt-3", text: "Very heavy" }
    ],
    correct: "opt-1"
  },
  true_false: {
    content: { text: "Is the sun a star?" },
    options: [
      { id: "opt-true", text: "True" },
      { id: "opt-false", text: "False" }
    ],
    correct: "opt-true"
  },
  matching: {
    content: { 
      text: "Match the following animal sounds:", 
      matchingPairs: [
        { leftId: "left-1", leftText: "Dog", rightId: "right-1", rightText: "Bark" },
        { leftId: "left-2", leftText: "Cat", rightId: "right-2", rightText: "Meow" }
      ]
    },
    options: [],
    correct: ["left-1", "left-2"]
  },
  jumbled_sentence: {
    content: { 
      text: "Rearrange the words to form a correct sentence:",
      scrambledLetters: ["I", "to", "school", "go", "every", "day"]
    },
    options: [],
    correct: ["I", "go", "to", "school", "every", "day"]
  },
  fill_blank: {
    content: { text: "She _____ to school every morning.", blank: "walks" },
    options: [
      { id: "opt-1", text: "walks" },
      { id: "opt-2", text: "walking" },
      { id: "opt-3", text: "walked" }
    ],
    correct: "opt-1"
  }
};

function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [qType, setQType] = useState("All");
  const [isActive, setIsActive] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formGoal, setFormGoal] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formSkill, setFormSkill] = useState("vocabulary");
  const [formDifficulty, setFormDifficulty] = useState("1");
  const [formType, setFormType] = useState("mcq");
  const [formLanguage, setFormLanguage] = useState("en");
  const [formContentJson, setFormContentJson] = useState("");
  const [formOptionsJson, setFormOptionsJson] = useState("");
  const [formCorrectJson, setFormCorrectJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function fetchQuestions() {
    setLoading(true);
    try {
      let url = "/admin/questions?";
      const params: string[] = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (skill !== "All") params.push(`skill=${skill.toLowerCase()}`);
      if (difficulty !== "All") params.push(`difficulty=${difficulty}`);
      if (qType !== "All") params.push(`question_type=${qType.toLowerCase()}`);
      if (isActive !== "All") params.push(`is_active=${isActive === "Active"}`);
      
      const data = await apiRequest<QuestionRecord[]>(url + params.join("&"));
      setQuestions(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load question bank records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
  }, [search, skill, difficulty, qType, isActive]);

  const handleApplyTemplate = (typeKey: string) => {
    const tmp = TEMPLATES[typeKey];
    if (tmp) {
      setFormContentJson(JSON.stringify(tmp.content, null, 2));
      setFormOptionsJson(JSON.stringify(tmp.options, null, 2));
      setFormCorrectJson(JSON.stringify(tmp.correct, null, 2));
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormGoal("General placement check");
    setFormDomain("English Literacy");
    setFormSkill("vocabulary");
    setFormDifficulty("1");
    setFormType("mcq");
    setFormLanguage("en");
    setFormContentJson(JSON.stringify(TEMPLATES.mcq.content, null, 2));
    setFormOptionsJson(JSON.stringify(TEMPLATES.mcq.options, null, 2));
    setFormCorrectJson(JSON.stringify(TEMPLATES.mcq.correct, null, 2));
    setJsonError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (q: QuestionRecord) => {
    setEditingId(q.id);
    setFormGoal(q.learning_goal);
    setFormDomain(q.domain);
    setFormSkill(q.skill);
    setFormDifficulty(String(q.difficulty));
    setFormType(q.question_type);
    setFormLanguage(q.language);
    setFormContentJson(JSON.stringify(q.question_content, null, 2));
    setFormOptionsJson(JSON.stringify(q.options, null, 2));
    setFormCorrectJson(JSON.stringify(q.correct_answer, null, 2));
    setJsonError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    // Validate JSON text fields
    let contentObj, optionsArr, correctVal;
    try {
      contentObj = JSON.parse(formContentJson);
    } catch {
      setJsonError("Invalid JSON inside 'Question Content' area.");
      return;
    }
    try {
      optionsArr = JSON.parse(formOptionsJson);
      if (!Array.isArray(optionsArr)) throw new Error();
    } catch {
      setJsonError("Invalid JSON inside 'Options' area. Must be a JSON array (e.g. []).");
      return;
    }
    try {
      correctVal = JSON.parse(formCorrectJson);
    } catch {
      setJsonError("Invalid JSON inside 'Correct Answer' area.");
      return;
    }

    const payload = {
      learning_goal: formGoal,
      domain: formDomain,
      skill: formSkill,
      difficulty: parseInt(formDifficulty),
      question_type: formType,
      language: formLanguage,
      question_content: contentObj,
      options: optionsArr,
      correct_answer: correctVal,
    };

    try {
      if (editingId) {
        await apiRequest(`/admin/questions/${editingId}`, "PUT", payload);
      } else {
        await apiRequest("/admin/questions", "POST", payload);
      }
      setModalOpen(false);
      fetchQuestions();
    } catch (err) {
      setJsonError((err as Error).message || "Failed to commit record updates.");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await apiRequest(`/admin/questions/${id}`, "DELETE");
      fetchQuestions();
    } catch (err) {
      setError((err as Error).message || "Failed to update active state.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Assessment Database</span>
          <h1 className="text-3xl font-black text-foreground mt-1">Question Bank CMS</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage assessment questions across all 10 formats with soft-deactivation.</p>
        </div>

        <Button onClick={handleOpenAdd} className="rounded-2xl font-bold gap-2 self-start sm:self-auto h-11 shadow-md">
          <Plus className="h-5 w-5" />
          Add New Question
        </Button>
      </div>

      {/* Filter controls panel */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5 col-span-1 sm:col-span-2 md:col-span-1">
              <Label className="text-xs font-bold text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Keyword search..."
                  className="pl-9 h-10 rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Skill Category</Label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Skills</SelectItem>
                  <SelectItem value="Reading">Reading</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                  <SelectItem value="Listening">Listening</SelectItem>
                  <SelectItem value="Speaking">Speaking</SelectItem>
                  <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                  <SelectItem value="Grammar">Grammar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Difficulties</SelectItem>
                  <SelectItem value="1">1 - Foundation</SelectItem>
                  <SelectItem value="2">2 - Beginner</SelectItem>
                  <SelectItem value="3">3 - Developing</SelectItem>
                  <SelectItem value="4">4 - Intermediate</SelectItem>
                  <SelectItem value="5">5 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Question Type</Label>
              <Select value={qType} onValueChange={setQType}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="matching">Matching Pairs</SelectItem>
                  <SelectItem value="jumbled_sentence">Jumbled Words</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Status</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active Only</SelectItem>
                  <SelectItem value="Inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions list Table */}
      <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold animate-pulse">Querying Question Bank...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
              <h3 className="text-md font-bold">Query Error</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
              <HelpCircle className="h-12 w-12 text-muted-foreground/45" />
              <p className="text-sm font-bold">No questions found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                    <th className="px-6 py-4">Question Text</th>
                    <th className="px-6 py-4">Skill Focus</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Format</th>
                    <th className="px-6 py-4">Correct Answer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {questions.map((q) => (
                    <tr key={q.id} className={`hover:bg-muted/5 ${!q.is_active ? "opacity-60 bg-muted/10" : ""}`}>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="font-extrabold text-foreground leading-tight truncate">
                          {q.question_content?.text || q.question_content?.prompt || "No text prompt"}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">Goal: {q.learning_goal}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize font-bold rounded-lg text-xs">
                          {q.skill}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        Level {q.difficulty}
                      </td>
                      <td className="px-6 py-4 font-semibold text-muted-foreground text-xs uppercase">
                        {q.question_type}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={q.is_active ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                          q.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                        }`}>
                          {q.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button onClick={() => handleOpenEdit(q)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" aria-label="Edit question">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleToggleActive(q.id)} variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${q.is_active ? "hover:text-destructive" : "hover:text-emerald-500"}`} aria-label={q.is_active ? "Deactivate question" : "Activate question"}>
                            {q.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
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

      {/* Edit/Add Overlay Drawer Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 px-6 py-5 shrink-0">
              <CardTitle className="text-lg font-black text-foreground">
                {editingId ? "Edit Question Record" : "Add Question to Bank"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              <form onSubmit={handleSave} className="space-y-4">
                {jsonError && (
                  <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Learning Goal</Label>
                    <Input value={formGoal} onChange={(e) => setFormGoal(e.target.value)} required placeholder="e.g. Initial placement check" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Domain</Label>
                    <Input value={formDomain} onChange={(e) => setFormDomain(e.target.value)} required placeholder="e.g. English Literacy" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Skill Focus</Label>
                    <Select value={formSkill} onValueChange={setFormSkill}>
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
                    <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Foundation</SelectItem>
                        <SelectItem value="2">2 - Beginner</SelectItem>
                        <SelectItem value="3">3 - Developing</SelectItem>
                        <SelectItem value="4">4 - Intermediate</SelectItem>
                        <SelectItem value="5">5 - Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Format Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                        <SelectItem value="matching">Matching Pairs</SelectItem>
                        <SelectItem value="jumbled_sentence">Jumbled Sentence</SelectItem>
                        <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Language</Label>
                    <Input value={formLanguage} onChange={(e) => setFormLanguage(e.target.value)} required />
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-muted-foreground mr-1">Load Presets:</span>
                  <Button type="button" variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => handleApplyTemplate("mcq")}>MCQ</Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => handleApplyTemplate("true_false")}>True/False</Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => handleApplyTemplate("matching")}>Matching</Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => handleApplyTemplate("jumbled_sentence")}>Jumbled Words</Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => handleApplyTemplate("fill_blank")}>Fill Blank</Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Question Content (JSON structure)</Label>
                  <Textarea
                    className="font-mono text-xs rounded-2xl h-32 border-border"
                    value={formContentJson}
                    onChange={(e) => setFormContentJson(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Options List (JSON array)</Label>
                    <Textarea
                      className="font-mono text-xs rounded-2xl h-24 border-border"
                      value={formOptionsJson}
                      onChange={(e) => setFormOptionsJson(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Correct Answer (JSON value)</Label>
                    <Textarea
                      className="font-mono text-xs rounded-2xl h-24 border-border"
                      value={formCorrectJson}
                      onChange={(e) => setFormCorrectJson(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2 shrink-0">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold text-xs">Save Question Record</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
