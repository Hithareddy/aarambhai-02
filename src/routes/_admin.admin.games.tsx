import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gamepad2, AlertCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/games")({
  component: AdminGamesPage,
});

interface GameRecord {
  id: string;
  name: string;
  game_type: string;
  skill: string;
  difficulty: number;
  learning_language: string;
  is_active: boolean;
  item_count: number;
}

function AdminGamesPage() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchGames() {
    try {
      const data = await apiRequest<GameRecord[]>("/admin/games");
      setGames(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load game records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGames();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/admin/games/${id}`, "PUT", { is_active: !currentStatus });
      fetchGames();
    } catch (err) {
      setError((err as Error).message || "Failed to toggle game status.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Gamification Hub</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Games & Practice Control</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage and toggle learner-side gamified practice activities while preserving individual game mechanics.</p>
      </div>

      <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold animate-pulse">Querying Gamified Engines...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
              <h3 className="text-md font-bold">Query Error</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
              <Gamepad2 className="h-12 w-12 text-muted-foreground/45" />
              <p className="text-sm font-bold">No game engines registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                    <th className="px-6 py-4">Game Name</th>
                    <th className="px-6 py-4">Game Mechanic</th>
                    <th className="px-6 py-4">Skill Targeted</th>
                    <th className="px-6 py-4">Language Support</th>
                    <th className="px-6 py-4">Activities Count</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {games.map((g) => (
                    <tr key={g.id} className={`hover:bg-muted/5 ${!g.is_active ? "opacity-60 bg-muted/10" : ""}`}>
                      <td className="px-6 py-4 font-extrabold text-foreground">{g.name}</td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-muted-foreground uppercase">{g.game_type}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold capitalize text-xs">
                          {g.skill}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground capitalize">{g.learning_language}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{g.item_count} Activities</td>
                      <td className="px-6 py-4">
                        <Badge variant={g.is_active ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                          g.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                        }`}>
                          {g.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button onClick={() => handleToggleActive(g.id, g.is_active)} variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${g.is_active ? "hover:text-destructive" : "hover:text-emerald-500"}`}>
                          {g.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
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
  );
}
