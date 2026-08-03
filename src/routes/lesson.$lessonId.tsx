import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { getLesson, saveLessonProgress } from "@/lib/api/learning";
import { BlockRenderer } from "@/components/learning/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLearningContext } from "@/context/learning-context";

export const Route = createFileRoute("/lesson/$lessonId")({
    component: LessonPlayer,
});

function LessonPlayer() {
    const { lessonId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setPageType, setLessonContext, clearLearningContext } = useLearningContext();

    // Load lesson data
    const { data: lesson, isLoading, error } = useQuery({
        queryKey: ["lesson", lessonId],
        queryFn: () => getLesson(lessonId),
    });

    React.useEffect(() => {
        setPageType("lesson");
        if (lesson) {
            setLessonContext({
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                moduleId: lesson.module_id || null,
                moduleTitle: (lesson as any).module?.title || null,
                skill: (lesson as any).module?.skill || null,
            });
        }
        return () => {
            clearLearningContext();
        };
    }, [lesson, setPageType, setLessonContext, clearLearningContext]);

    const [completedBlocks, setCompletedBlocks] = React.useState<Record<string, boolean>>({});

    const allBlocksComplete = React.useMemo(() => {
        if (!lesson?.content_blocks || lesson.content_blocks.length === 0) return true;
        return lesson.content_blocks.every(b => completedBlocks[b.id]);
    }, [lesson, completedBlocks]);

    // Track completion mutation
    const completeMutation = useMutation({
        mutationFn: async () => {
            await saveLessonProgress(lessonId, {
                status: "completed",
                progress_percentage: 100,
                time_spent_seconds: 120, // Simplified tracking for now
            });
        },
        onSuccess: () => {
            // Invalidate dashboard snapshot so it triggers the next recommendation automatically
            queryClient.invalidateQueries({ queryKey: ["dashboardSnapshot"] });
            // Redirect back to dashboard safely
            navigate({ to: "/dashboard" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="container py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
                <Button asChild variant="outline">
                    <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navbar */}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center max-w-3xl mx-auto">
                    <Button variant="ghost" size="icon" asChild className="mr-4">
                        <Link to="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <div className="font-semibold text-lg line-clamp-1">{lesson.title}</div>
                </div>
            </header>

            {/* Main Container */}
            <main className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">

                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                        {/* Render dynamic blocks recursively */}
                        {(lesson.content_blocks || []).map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                onComplete={() => setCompletedBlocks(prev => ({ ...prev, [block.id]: true }))}
                            />
                        ))}
                    </CardContent>
                </Card>

                {/* Completion Action */}
                <div className="mt-12 mb-8 pt-8 border-t flex flex-col items-center">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto px-8"
                        onClick={() => completeMutation.mutate()}
                        disabled={completeMutation.isPending || !allBlocksComplete}
                    >
                        {completeMutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                        )}
                        Complete Lesson
                    </Button>
                    <p className="text-muted-foreground text-sm mt-4">
                        Continuing will mark this lesson as completed and unlock the next lesson.
                    </p>
                </div>

            </main>
        </div>
    );
}
