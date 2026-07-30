import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Volume2,
  Mic,
  PenTool,
  Gamepad2,
  Sparkles,
  Play,
  Clock,
  Award,
  CheckCircle2,
  Image as ImageIcon,
  Flame
} from "lucide-react";
import { getAssessmentHistory } from "@/lib/api/assessment";

export const Route = createFileRoute("/_app/practice")({
  head: () => ({ meta: [{ title: "Daily Practice Hub — Aarambh AI" }] }),
  component: PracticePage,
});

export interface PracticeActivityItem {
  id: string;
  title: string;
  category: 'Vocabulary' | 'Reading' | 'Listening' | 'Speaking' | 'Writing' | 'Games';
  description: string;
  estimatedTime: string;
  xpReward: number;
  progressPercent: number;
  icon: any;
  routeTarget?: string;
}

export const PRACTICE_ACTIVITIES: PracticeActivityItem[] = [
  {
    id: 'act-1',
    title: '1. Fruits & Food Vocabulary',
    category: 'Vocabulary',
    description: 'Master everyday food, fruits, and vegetable names with crisp visual cards.',
    estimatedTime: '5 mins',
    xpReward: 50,
    progressPercent: 60,
    icon: ImageIcon,
    routeTarget: '/games/picture-match',
  },
  {
    id: 'act-2',
    title: '2. Picture & Sign Reading',
    category: 'Reading',
    description: 'Read real-world road signs, medicine labels, and daily shop ticket prompts.',
    estimatedTime: '7 mins',
    xpReward: 70,
    progressPercent: 40,
    icon: BookOpen,
    routeTarget: '/games/word-search',
  },
  {
    id: 'act-3',
    title: '3. Listening & Audio Match',
    category: 'Listening',
    description: 'Listen to spoken phrases and match them to the correct picture choices.',
    estimatedTime: '6 mins',
    xpReward: 60,
    progressPercent: 80,
    icon: Volume2,
    routeTarget: '/games/listen-choose',
  },
  {
    id: 'act-4',
    title: '4. Everyday Speaking Practice',
    category: 'Speaking',
    description: 'Practice speaking common greeting words and picture descriptions out loud.',
    estimatedTime: '5 mins',
    xpReward: 50,
    progressPercent: 20,
    icon: Mic,
    routeTarget: '/games/flashcards',
  },
  {
    id: 'act-5',
    title: '5. Sentence Builder Writing',
    category: 'Writing',
    description: 'Unscramble scrambled words and letters to construct complete English sentences.',
    estimatedTime: '8 mins',
    xpReward: 80,
    progressPercent: 50,
    icon: PenTool,
    routeTarget: '/games/sentence-builder',
  },
  {
    id: 'act-6',
    title: '6. Flash Cards Activity',
    category: 'Games',
    description: 'Interactive flash cards with 4 choices, explanations, and example sentences.',
    estimatedTime: '5 mins',
    xpReward: 50,
    progressPercent: 90,
    icon: Gamepad2,
    routeTarget: '/games/flashcards',
  },
  {
    id: 'act-7',
    title: '7. Picture Match Game',
    category: 'Games',
    description: 'Match real category images (Animals, Vehicles, Colors) to English words.',
    estimatedTime: '5 mins',
    xpReward: 50,
    progressPercent: 75,
    icon: Gamepad2,
    routeTarget: '/games/picture-match',
  },
  {
    id: 'act-8',
    title: '8. Memory Match Card Game',
    category: 'Games',
    description: 'Flip and pair picture/word cards in minimal moves to earn maximum XP.',
    estimatedTime: '5 mins',
    xpReward: 60,
    progressPercent: 30,
    icon: Gamepad2,
    routeTarget: '/games/memory-match',
  },
];

function PracticePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [weakestSkill, setWeakestSkill] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeakness = async () => {
      try {
        const history = await getAssessmentHistory();
        const latest = history[0];
        if (latest && latest.skillOutcomes && latest.skillOutcomes.length > 0) {
          const sortedOutcomes = [...latest.skillOutcomes].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
          if (sortedOutcomes[0] && (sortedOutcomes[0].score ?? 1) < 0.6) {
            setWeakestSkill(sortedOutcomes[0].skill);
          }
        }
      } catch (err) {
        console.warn("Failed to check diagnostic weakness for practice:", err);
      }
    };
    fetchWeakness();
  }, []);

  const getRecommendationForWeakness = (skill: string) => {
    const s = skill.toLowerCase();
    if (s.includes("vocab")) {
      return {
        title: "Focus Practice: Word Match Game",
        desc: "Strengthen your vocabulary by matching core everyday words to definitions.",
        route: "/games/word-match",
        label: "Vocabulary Practice",
        icon: "📖",
      };
    } else if (s.includes("grammar") || s.includes("writing") || s.includes("sentence")) {
      return {
        title: "Focus Practice: Sentence Builder Game",
        desc: "Construct complete, grammatically correct sentences using drag-and-drop chips.",
        route: "/games/sentence-builder",
        label: "Grammar & Sentence Practice",
        icon: "✍️",
      };
    } else if (s.includes("listen")) {
      return {
        title: "Focus Practice: Listen & Choose Game",
        desc: "Match clear spoken audio clips to the correct visual items.",
        route: "/games/listen-choose",
        label: "Listening Comprehension Practice",
        icon: "🎧",
      };
    } else {
      return {
        title: "Focus Practice: Vocabulary Flash Cards",
        desc: "Master key phrases, visual words, and translations.",
        route: "/games/flashcards",
        label: "General Communication Practice",
        icon: "🃏",
      };
    }
  };

  const filteredActivities = selectedCategory === 'All'
    ? PRACTICE_ACTIVITIES
    : PRACTICE_ACTIVITIES.filter((act) => act.category === selectedCategory);

  const categories = ['All', 'Vocabulary', 'Reading', 'Listening', 'Speaking', 'Writing', 'Games'];

  const handleStartActivity = (act: PracticeActivityItem) => {
    if (act.routeTarget) {
      navigate({ to: act.routeTarget as any });
    } else {
      navigate({ to: '/assessment-quiz' as any });
    }
  };

  const rec = weakestSkill ? getRecommendationForWeakness(weakestSkill) : null;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Daily Practice Hub"
        title="Today's Tailored Learning Journey"
        description="Strengthen your listening, speaking, reading, writing, and vocabulary skills through interactive daily activities."
      />

      {/* Daily Progress Banner */}
      <Card className="p-6 rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl shadow-lg shrink-0">
            <Flame className="h-9 w-9 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">3 Day Practice Streak! 🔥</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Complete 2 activities today to earn your Daily Explorer Badge.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total XP Earned</span>
            <div className="text-2xl font-black text-primary">+430 XP</div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto h-14 rounded-2xl font-bold gap-2 text-base shadow-lg"
            onClick={() => navigate({ to: "/games/flashcards" as any })}
          >
            <Play className="h-5 w-5 fill-current" />
            Quick Practice
          </Button>
        </div>
      </Card>

      {/* Target Focus Area Recommendation Banner */}
      {rec && (
        <Card className="p-6 rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-background shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500 text-white font-bold text-xs rounded-lg px-2.5 py-0.5 flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3 w-3" />
                <span>Target Diagnostic Focus</span>
              </Badge>
              <span className="text-xs text-muted-foreground font-semibold">Based on weakest skill: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{weakestSkill}</span></span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-4xl select-none leading-none pt-1">{rec.icon}</span>
              <div>
                <h4 className="text-lg font-extrabold text-foreground leading-snug">{rec.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">{rec.desc}</p>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 rounded-2xl font-bold gap-2 text-sm shadow-md shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => navigate({ to: rec.route as any })}
          >
            <Play className="h-4 w-4 fill-current" />
            Play Game
          </Button>
        </Card>
      )}

      {/* Category Filter Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
          Filter Activities:
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-xl font-bold text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Practice Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActivities.map((act) => {
          const IconComp = act.icon;
          return (
            <Card
              key={act.id}
              className="p-6 rounded-3xl border-2 border-border/80 bg-card hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    {act.category}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {act.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Award className="h-3.5 w-3.5" />
                      +{act.xpReward} XP
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-secondary text-primary shrink-0">
                    <IconComp className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-foreground leading-snug">{act.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{act.description}</p>
                  </div>
                </div>
              </div>

              {/* Progress & Start CTA */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Completion Progress</span>
                  <span className="text-primary">{act.progressPercent}%</span>
                </div>
                <Progress value={act.progressPercent} className="h-2 rounded-full" />

                <Button
                  size="lg"
                  className="w-full h-12 rounded-2xl font-bold gap-2 text-sm shadow-md mt-2"
                  onClick={() => handleStartActivity(act)}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Activity →
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

