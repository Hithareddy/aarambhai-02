import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dev/validation")({
    component: ValidationDashboard,
});

interface ValidationReport {
    total_modules: number;
    total_lessons: number;
    orphaned_lessons: number;
    empty_modules: number;
    accessibility_warnings: string[];
    content_errors: string[];
    is_valid: boolean;
}

function ValidationDashboard() {
    const { data, isLoading, isError, refetch } = useQuery<ValidationReport>({
        queryKey: ["validation-report"],
        queryFn: () => apiRequest<ValidationReport>("/validation/report"),
    });

    if (isLoading) {
        return <div className="p-8 text-muted-foreground animate-pulse">Running Curriculum Audit...</div>;
    }

    if (isError || !data) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Validation Service Failed</AlertTitle>
                    <AlertDescription>Could not reach the Validation API. Ensure the backend is active.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const {
        total_modules,
        total_lessons,
        orphaned_lessons,
        empty_modules,
        accessibility_warnings,
        content_errors,
        is_valid,
    } = data;

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Curriculum Validation
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Automated Quality Assurance and Content Validation Sweep.</p>
                </div>
                <Badge variant={is_valid ? "default" : "destructive"} className="px-4 py-1.5 text-sm uppercase tracking-wider">
                    {is_valid ? "VALID" : "INVALID"}
                </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget label="Modules" value={total_modules} safe />
                <StatWidget label="Lessons" value={total_lessons} safe />
                <StatWidget label="Orphans" value={orphaned_lessons} safe={orphaned_lessons === 0} />
                <StatWidget label="Empty Modules" value={empty_modules} safe={empty_modules === 0} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-warning/50 bg-warning/5">
                    <CardHeader>
                        <CardTitle className="text-warning flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Accessibility Warnings ({accessibility_warnings.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {accessibility_warnings.length === 0 ? (
                            <p className="text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> All Clear</p>
                        ) : (
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {accessibility_warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Content Traversal Errors ({content_errors.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {content_errors.length === 0 ? (
                            <p className="text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> All Clear</p>
                        ) : (
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {content_errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatWidget({ label, value, safe }: { label: string, value: number, safe: boolean }) {
    return (
        <Card className={`p-5 transition-shadow ${!safe ? 'border-destructive/50' : ''}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-2 font-display text-4xl font-semibold tabular-nums ${!safe ? 'text-destructive' : ''}`}>
                {value}
            </p>
        </Card>
    );
}
