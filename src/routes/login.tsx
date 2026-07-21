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
import { login } from "@/lib/api/auth";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Aarambh AI" }] }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError((err as Error).message || t("login.failed") || "Failed to sign in");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("login.title") || "Welcome back"}
      subtitle={t("login.subtitle") || "Sign in to continue your learning journey."}
      footer={
        <>
          {t("login.dontHaveAccount") || "Don't have an account?"}{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            {t("login.createOne") || "Create one"}
          </Link>
        </>
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
            type="email"
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
              type={show ? "text" : "password"}
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
