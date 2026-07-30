import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Check, Lock } from "lucide-react";

export const Route = createFileRoute("/role-selection")({
  head: () => ({
    meta: [{ title: "Choose your role — Aarambh AI" }],
  }),
  component: RoleSelectionPage,
});

function RoleSelectionPage() {
  const [role, setRole] = useState<"user" | "admin" | null>("user");
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/language-selection">Back</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 2 of 2</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          How will you use Aarambh AI?
        </h1>
        <p className="mt-2 max-w-xl text-center text-muted-foreground">
          Choose the role that best describes you.
        </p>

        <div className="mt-10 grid w-full gap-5 sm:grid-cols-2">
          <button
            onClick={() => setRole("user")}
            className={`relative rounded-2xl border-2 bg-card p-8 text-left transition ${
              role === "user" ? "border-primary shadow-md" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">Learner</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              I want to learn something new at my own pace.
            </p>
            {role === "user" && (
              <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </span>
            )}
          </button>

          <button
            onClick={() => setRole("admin")}
            className={`relative rounded-2xl border-2 bg-card p-8 text-left transition ${
              role === "admin" ? "border-primary shadow-md" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">Admin</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage learners, content and reports.
            </p>
            {role === "admin" && (
              <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>

        <Button 
          size="lg" 
          className="mt-10 min-w-[200px]" 
          onClick={() => {
            if (role === "admin") {
              navigate({ to: "/login", search: { role: "admin" } });
            } else {
              navigate({ to: "/signup" });
            }
          }}
        >
          {role === "admin" ? "Continue as Admin" : "Continue as Learner"}
        </Button>
      </main>
    </div>
  );
}
