import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { login, logout } from "@/lib/api/auth";
import { apiRequest } from "@/lib/api/http";
import { useLanguage } from "@/hooks/use-language";
import { z } from "zod";

const loginSearchSchema = z.object({
  role: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Aarambh AI" }] }),
  validateSearch: (search) => loginSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { role } = Route.useSearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);

      // Always fetch the user record immediately after login to check role.
      const profile = await apiRequest<any>("/users/me");

      if (profile.is_superuser) {
        // Admin accounts go directly to the admin portal — always.
        // They must never enter the learner onboarding or dashboard flow.
        navigate({ to: "/admin" as any });
      } else if (role === "admin") {
        // A non-admin tried to log in through the admin entry point.
        logout();
        throw new Error("This account does not have administrator access.");
      } else {
        // Check if learner profile exists to determine onboarding status
        try {
          await apiRequest<any>("/learners/me");
          navigate({ to: "/dashboard" as any });
        } catch (err: any) {
          if (err?.status === 404) {
            navigate({ to: "/onboarding" as any });
          } else {
            // Default to dashboard on network error or other server issue
            navigate({ to: "/dashboard" as any });
          }
        }
      }
    } catch (err) {
      setError((err as Error).message || t("login.failed") || "Failed to sign in");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={role === "admin" ? "Admin Sign In" : (t("login.title") || "Welcome back")}
      subtitle={role === "admin"
        ? "Sign in with your administrator credentials."
        : (t("login.subtitle") || "Sign in to continue your learning journey.")}
      footer={
        role !== "admin" ? (
          <>
            {t("login.dontHaveAccount") || "Don't have an account?"}{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              {t("login.createOne") || "Create one"}
            </Link>
          </>
        ) : undefined
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">{t("login.email") || "Email"}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.password") || "Password"}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("login.forgotPassword") || "Forgot password?"}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox id="remember" /> {t("login.rememberMe") || "Remember me"}
        </label>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (t("login.signingIn") || "Signing in...") : (t("login.signIn") || "Sign in")}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("login.or") || "or"}</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-2">
        <Button variant="outline" type="button">{t("login.continueWithGoogle") || "Continue with Google"}</Button>
        <Button variant="outline" type="button">{t("login.continueWithApple") || "Continue with Apple"}</Button>
      </div>
    </AuthShell>
  );
}
