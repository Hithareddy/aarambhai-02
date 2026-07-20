import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface QueryStateProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders skeleton / error / data uniformly so every page treats loading and
 * error the same way. Data is only rendered when defined.
 */
export function QueryState<T>({
  data,
  isLoading,
  error,
  onRetry,
  skeleton,
  children,
}: QueryStateProps<T>) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading || data === undefined) return <>{skeleton}</>;
  return <>{children(data)}</>;
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="font-display text-base font-semibold">We couldn't load this</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  );
}
