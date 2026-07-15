import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

interface BrandLogoProps {
  variant?: "full" | "mark";
  className?: string;
  to?: string;
}

export function BrandLogo({ variant = "full", className = "", to = "/" }: BrandLogoProps) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Aarambh AI home">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      {variant === "full" && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Aarambh <span className="text-primary">AI</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Begin Learning
          </span>
        </span>
      )}
    </Link>
  );
}
