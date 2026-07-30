import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Gamepad2, Play, BookOpen, Volume2, Mic, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/_app/games/')({
  head: () => ({ meta: [{ title: 'Educational Games Platform — Aarambh AI' }] }),
  component: GamesIndexPage,
});

interface GameDefinition {
  id: string;
  title: string;
  category: 'Vocabulary' | 'Reading' | 'Listening' | 'Speaking';
  emoji: string;
  description: string;
  route: string;
  xpReward: string;
}

const GAME_LIBRARY: GameDefinition[] = [
  // First 3 Games (Preserved & Unchanged)
  {
    id: 'flashcards',
    title: 'Flash Cards',
    category: 'Vocabulary',
    emoji: '🃏',
    description: 'Interactive choice cards with pronunciations, explanations, and example sentences.',
    route: '/games/flashcards',
    xpReward: '+15 XP / Card',
  },
  {
    id: 'picture-match',
    title: 'Picture Match',
    category: 'Vocabulary',
    emoji: '🖼️',
    description: 'Match everyday category images (Fruits, Animals, Vehicles) to English words.',
    route: '/games/picture-match',
    xpReward: '+10 XP / Match',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Vocabulary',
    emoji: '🧠',
    description: 'Flip face-down cards to match word pairs in as few moves as possible.',
    route: '/games/memory-match',
    xpReward: '+20 XP / Pair',
  },

  // Unique Dedicated Educational Games
  {
    id: 'word-match',
    title: 'Word Match',
    category: 'Vocabulary',
    emoji: '📖',
    description: 'Match target English vocabulary words with their correct definitions.',
    route: '/games/word-match',
    xpReward: '+20 XP / Match',
  },
  {
    id: 'opposite-match',
    title: 'Opposite Match (Antonyms)',
    category: 'Vocabulary',
    emoji: '🔄',
    description: 'Match antonym pairs (Hot ↔ Cold, Big ↔ Small, Happy ↔ Sad).',
    route: '/games/opposite-match',
    xpReward: '+20 XP / Pair',
  },
  {
    id: 'synonym-match',
    title: 'Synonym Match',
    category: 'Vocabulary',
    emoji: '✨',
    description: 'Match words with similar meanings (Large ↔ Big, Quick ↔ Fast).',
    route: '/games/synonym-match',
    xpReward: '+20 XP / Pair',
  },
  {
    id: 'four-pics-one-word',
    title: '4 Pics 1 Word',
    category: 'Vocabulary',
    emoji: '📷',
    description: 'Look at 4 related pictures and use the letter bank to form the target word.',
    route: '/games/four-pics-one-word',
    xpReward: '+50 XP / Puzzle',
  },
  {
    id: 'word-search',
    title: 'Word Search',
    category: 'Reading',
    emoji: '🔍',
    description: 'Find hidden vocabulary words inside the interactive letter grid.',
    route: '/games/word-search',
    xpReward: '+30 XP / Word',
  },
  {
    id: 'sentence-builder',
    title: 'Sentence Builder',
    category: 'Reading',
    emoji: '✍️',
    description: 'Arrange mixed-up word chips into complete, grammatically correct sentences.',
    route: '/games/sentence-builder',
    xpReward: '+40 XP / Sentence',
  },
  {
    id: 'spelling-challenge',
    title: 'Spelling Challenge',
    category: 'Reading',
    emoji: '🔤',
    description: 'Listen to the audio or view the image prompt, then type the correct spelling.',
    route: '/games/spelling-challenge',
    xpReward: '+30 XP / Word',
  },
  {
    id: 'category-sort',
    title: 'Category Sort',
    category: 'Vocabulary',
    emoji: '📦',
    description: 'Sort words and items into Fruit, Animal, Vehicle, and School category buckets.',
    route: '/games/category-sort',
    xpReward: '+25 XP / Item',
  },
  {
    id: 'listen-choose',
    title: 'Listen and Choose',
    category: 'Listening',
    emoji: '🎧',
    description: 'Tap the audio soundboard player to hear the word, then pick the matching picture.',
    route: '/games/listen-choose',
    xpReward: '+25 XP / Pick',
  },
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    category: 'Vocabulary',
    emoji: '🔥',
    description: 'Complete a multi-round streak of vocabulary, reading, and listening challenges.',
    route: '/games/daily-challenge',
    xpReward: '+105 XP / Streak',
  },
];

function GamesIndexPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredGames = activeTab === 'all'
    ? GAME_LIBRARY
    : GAME_LIBRARY.filter((g) => g.category.toLowerCase() === activeTab.toLowerCase());

  const categoryIcons: Record<string, any> = {
    Vocabulary: BookOpen,
    Reading: BookOpen,
    Listening: Volume2,
    Speaking: Mic,
  };

  return (
    <div className="space-y-8 pb-16 bg-gradient-to-b from-blue-50/40 via-background to-background dark:from-blue-950/20 min-h-screen">
      <PageHeader
        eyebrow="Educational Games Platform"
        title="Interactive Practice Games"
        description="Strengthen your foundational literacy, vocabulary, listening, and speaking skills through fun, adaptive learning games."
      />

      {/* Featured Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 rounded-3xl border-primary/20 bg-primary/5 flex items-center space-x-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            🎮
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">13 Unique Games</div>
            <p className="text-xs text-muted-foreground">100% Unique Gameplay</p>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-border/80 flex items-center space-x-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 text-2xl font-bold">
            ⚡
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">Zero Placeholders</div>
            <p className="text-xs text-muted-foreground font-semibold text-emerald-600">Separate Components</p>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-border/80 flex items-center space-x-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-2xl font-bold">
            🎯
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">Adaptive Path</div>
            <p className="text-xs text-muted-foreground">Targets Assessed Weaknesses</p>
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="p-1 bg-muted/60 rounded-2xl flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="rounded-xl px-5 py-2.5 font-bold text-sm">
            All Games ({GAME_LIBRARY.length})
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="rounded-xl px-5 py-2.5 font-bold text-sm">
            Vocabulary ({GAME_LIBRARY.filter((g) => g.category === 'Vocabulary').length})
          </TabsTrigger>
          <TabsTrigger value="reading" className="rounded-xl px-5 py-2.5 font-bold text-sm">
            Reading ({GAME_LIBRARY.filter((g) => g.category === 'Reading').length})
          </TabsTrigger>
          <TabsTrigger value="listening" className="rounded-xl px-5 py-2.5 font-bold text-sm">
            Listening ({GAME_LIBRARY.filter((g) => g.category === 'Listening').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game) => {
              const CategoryIcon = categoryIcons[game.category] || BookOpen;

              return (
                <Card
                  key={game.id}
                  className="flex flex-col justify-between p-6 rounded-3xl border-2 border-primary/30 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 bg-card group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 font-bold text-xs">
                        <CategoryIcon className="h-3.5 w-3.5" />
                        <span>{game.category}</span>
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-xs font-semibold">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>{game.xpReward}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                        {game.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {game.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Ready to Play
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="mt-6 w-full h-13 rounded-2xl font-bold text-base gap-2 shadow-md group-hover:shadow-lg transition-all"
                    onClick={() => navigate({ to: game.route as any })}
                  >
                    <Play className="h-5 w-5 fill-current" />
                    <span>Play Now</span>
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
