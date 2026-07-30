import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  BookOpen,
  Volume2,
  Mic,
  PenTool,
  Sparkles,
  Play,
  Clock,
  Award,
  Filter,
  Bookmark,
  CheckCircle2,
  Flame,
  Layers,
  Image as ImageIcon
} from "lucide-react";

export const Route = createFileRoute("/_app/learn")({
  head: () => ({ meta: [{ title: "Learn & Explore — Aarambh AI" }] }),
  component: LearnPage,
});

export interface LearnModule {
  id: string;
  title: string;
  domain: 'Vocabulary' | 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  categoryTag: string;
  description: string;
  difficulty: 'Beginner' | 'Foundational' | 'Intermediate';
  estimatedTime: string;
  lessonCount: number;
  xpReward: number;
  progressPercent: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  routeTarget: string;
  icon: any;
}

export const LEARN_MODULES: LearnModule[] = [
  // Vocabulary Modules
  {
    id: 'mod-voc-1',
    title: '🍎 Fruits & Everyday Food',
    domain: 'Vocabulary',
    categoryTag: 'Fruits & Food',
    description: 'Learn names of fresh fruits, vegetables, drinks, and meals with audio pronunciation.',
    difficulty: 'Beginner',
    estimatedTime: '8 mins',
    lessonCount: 5,
    xpReward: 60,
    progressPercent: 40,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/games/picture-match',
    icon: ImageIcon,
  },
  {
    id: 'mod-voc-2',
    title: '🐘 Animals & Birds World',
    domain: 'Vocabulary',
    categoryTag: 'Animals & Birds',
    description: 'Explore wild and domestic animals, habitats, and bird names through picture cards.',
    difficulty: 'Beginner',
    estimatedTime: '10 mins',
    lessonCount: 6,
    xpReward: 70,
    progressPercent: 60,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/games/flashcards',
    icon: ImageIcon,
  },
  {
    id: 'mod-voc-3',
    title: '🌈 Colors & Basic Shapes',
    domain: 'Vocabulary',
    categoryTag: 'Colors & Shapes',
    description: 'Recognize vibrant primary colors, geometric shapes, and object properties.',
    difficulty: 'Beginner',
    estimatedTime: '6 mins',
    lessonCount: 4,
    xpReward: 50,
    progressPercent: 80,
    isRecommended: true,
    routeTarget: '/games/memory-match',
    icon: Sparkles,
  },
  {
    id: 'mod-voc-4',
    title: '🚗 Vehicles & Transport',
    domain: 'Vocabulary',
    categoryTag: 'Vehicles',
    description: 'Master public transport names including cars, buses, trains, bicycles, and airplanes.',
    difficulty: 'Beginner',
    estimatedTime: '7 mins',
    lessonCount: 5,
    xpReward: 60,
    progressPercent: 20,
    routeTarget: '/games/picture-match',
    icon: Layers,
  },

  // Reading Modules
  {
    id: 'mod-rd-1',
    title: '🛑 Road Signs & Safety Notices',
    domain: 'Reading',
    categoryTag: 'Road Signs',
    description: 'Read essential street traffic signs, safety warnings, and public notices confidently.',
    difficulty: 'Beginner',
    estimatedTime: '8 mins',
    lessonCount: 4,
    xpReward: 70,
    progressPercent: 50,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/assessment-quiz',
    icon: BookOpen,
  },
  {
    id: 'mod-rd-2',
    title: '💊 Medicine Labels & Dosage',
    domain: 'Reading',
    categoryTag: 'Health Reading',
    description: 'Read prescription instructions, morning/night dosage, and pharmacy labels safely.',
    difficulty: 'Foundational',
    estimatedTime: '10 mins',
    lessonCount: 5,
    xpReward: 80,
    progressPercent: 10,
    isRecommended: true,
    routeTarget: '/assessment-quiz',
    icon: BookOpen,
  },
  {
    id: 'mod-rd-3',
    title: '🚌 Bus Tickets & Station Timings',
    domain: 'Reading',
    categoryTag: 'Public Transport',
    description: 'Read destination bus tickets, platform signs, and schedule boards.',
    difficulty: 'Foundational',
    estimatedTime: '9 mins',
    lessonCount: 5,
    xpReward: 75,
    progressPercent: 0,
    routeTarget: '/assessment-quiz',
    icon: BookOpen,
  },

  // Speaking Modules
  {
    id: 'mod-spk-1',
    title: '🤝 Introduce Yourself & Greetings',
    domain: 'Speaking',
    categoryTag: 'Greetings',
    description: 'Practice basic spoken introductions, saying hello, goodbye, and polite phrases.',
    difficulty: 'Beginner',
    estimatedTime: '7 mins',
    lessonCount: 4,
    xpReward: 60,
    progressPercent: 70,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/assessment-quiz',
    icon: Mic,
  },
  {
    id: 'mod-spk-2',
    title: '🏪 Shopping & Market Conversation',
    domain: 'Speaking',
    categoryTag: 'Shopping',
    description: 'Practice asking prices, vegetable shopping dialogue, and payment phrases.',
    difficulty: 'Foundational',
    estimatedTime: '10 mins',
    lessonCount: 6,
    xpReward: 85,
    progressPercent: 30,
    isRecommended: true,
    routeTarget: '/assessment-quiz',
    icon: Mic,
  },

  // Listening Modules
  {
    id: 'mod-lst-1',
    title: '👂 Word & Picture Listening',
    domain: 'Listening',
    categoryTag: 'Audio Recognition',
    description: 'Listen to spoken english words and identify matching scenario picture cards.',
    difficulty: 'Beginner',
    estimatedTime: '6 mins',
    lessonCount: 4,
    xpReward: 50,
    progressPercent: 85,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/games/flashcards',
    icon: Volume2,
  },
  {
    id: 'mod-lst-2',
    title: '📢 Public Announcements Listening',
    domain: 'Listening',
    categoryTag: 'Announcements',
    description: 'Listen to bus station, hospital reception, and shop voice announcements.',
    difficulty: 'Foundational',
    estimatedTime: '8 mins',
    lessonCount: 5,
    xpReward: 70,
    progressPercent: 0,
    routeTarget: '/games/flashcards',
    icon: Volume2,
  },

  // Writing Modules
  {
    id: 'mod-wrt-1',
    title: '✍ Sentence Builder & Unscramble',
    domain: 'Writing',
    categoryTag: 'Sentence Construction',
    description: 'Build complete sentences by arranging word chips and unscrambling letter tokens.',
    difficulty: 'Foundational',
    estimatedTime: '9 mins',
    lessonCount: 5,
    xpReward: 80,
    progressPercent: 45,
    isPopular: true,
    isRecommended: true,
    routeTarget: '/games/flashcards',
    icon: PenTool,
  },
];

function LearnPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const filteredModules = LEARN_MODULES.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categoryTag.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = selectedDomain === 'All' || m.domain === selectedDomain;
    const matchesDiff = selectedDifficulty === 'All' || m.difficulty === selectedDifficulty;

    return matchesSearch && matchesDomain && matchesDiff;
  });

  const domains = ['All', 'Vocabulary', 'Reading', 'Listening', 'Speaking', 'Writing'];

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Interactive Learn Catalog"
        title="Explore Foundational Learning Modules"
        description="Choose from curated literacy, vocabulary, reading, listening, and speaking modules tailored for beginners."
      />

      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons, vocabulary, road signs, or speaking skills..."
            className="pl-10 h-12 rounded-2xl bg-card border-border/80 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Beginner', 'Foundational'].map((diff) => (
            <Button
              key={diff}
              variant={selectedDifficulty === diff ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(diff)}
              className="rounded-xl font-bold text-xs h-12 px-4"
            >
              {diff === 'All' ? 'All Levels' : diff}
            </Button>
          ))}
        </div>
      </div>

      {/* Domain Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted/40 rounded-2xl border">
        {domains.map((dom) => (
          <Button
            key={dom}
            variant={selectedDomain === dom ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedDomain(dom)}
            className="rounded-xl font-bold text-xs px-4"
          >
            {dom === 'All' ? 'All Skills (12)' : dom}
          </Button>
        ))}
      </div>

      {/* Continue Learning Row */}
      {selectedDomain === 'All' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" /> Continue Learning
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">Active In-Progress Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEARN_MODULES.filter((m) => m.progressPercent > 0 && m.progressPercent < 100)
              .slice(0, 2)
              .map((m) => (
                <Card
                  key={m.id}
                  className="p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">
                        {m.domain}
                      </Badge>
                      <span className="text-xs font-bold text-emerald-600">+{m.xpReward} XP</span>
                    </div>

                    <h4 className="text-xl font-extrabold text-foreground">{m.title}</h4>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-primary">{m.progressPercent}%</span>
                    </div>
                    <Progress value={m.progressPercent} className="h-2 rounded-full" />
                    <Button
                      size="lg"
                      className="w-full h-12 rounded-2xl font-bold gap-2 text-sm shadow-md mt-2"
                      onClick={() => navigate({ to: m.routeTarget as any })}
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Continue Lesson →
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Main Module Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Recommended & Popular Modules
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {filteredModules.length} learning modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((m) => {
            const IconComponent = m.icon;
            return (
              <Card
                key={m.id}
                className="p-6 rounded-3xl border-2 border-border/80 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground font-bold text-xs">
                      {m.domain}
                    </Badge>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {m.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-extrabold text-foreground leading-snug">{m.title}</h4>
                      <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {m.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <Award className="h-3.5 w-3.5" />
                          +{m.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>{m.lessonCount} Lessons</span>
                    <span>{m.progressPercent}% Completed</span>
                  </div>
                  <Progress value={m.progressPercent} className="h-2 rounded-full" />

                  <Button
                    size="lg"
                    className="w-full h-12 rounded-2xl font-bold gap-2 text-sm shadow-md"
                    onClick={() => navigate({ to: m.routeTarget as any })}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {m.progressPercent > 0 ? 'Continue Module' : 'Start Module'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
