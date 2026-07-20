import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="gradient-hero relative hidden flex-col justify-between p-10 lg:flex">
        <BrandLogo />
        <div>
          <p className="max-w-md font-display text-3xl font-semibold leading-tight text-foreground text-balance">
            Learning that meets you where you are — in your language, at your pace.
          </p>
          <p className="mt-4 max-w-md text-muted-foreground">
            Aarambh AI is designed for first-time learners, students, and every curious mind.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Aarambh AI</p>
      </div>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5 lg:hidden">
          <BrandLogo />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <Card className="mt-6 p-6 sm:p-7">{children}</Card>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
