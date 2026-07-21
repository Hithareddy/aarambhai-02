import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { register } from "@/lib/api/auth";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Aarambh AI" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
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
      await register(name, email, password);
      navigate({ to: "/onboarding" });
    } catch (err) {
      setError((err as Error).message || t("signup.failed") || "Failed to create account");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("signup.title") || "Create your account"}
      subtitle={t("signup.subtitle") || "A few details and you're on your way."}
      footer={
        <>
          {t("signup.alreadyHaveAccount") || "Already have an account?"}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("signup.signIn") || "Sign in"}
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
          <Label htmlFor="name">{t("signup.fullName") || "Full name"}</Label>
          <Input
            id="name"
            required
            placeholder={t("signup.fullNamePlaceholder") || "Your name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("signup.email") || "Email"}</Label>
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
          <Label htmlFor="password">{t("signup.password") || "Password"}</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              required
              minLength={8}
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
          <p className="text-xs text-muted-foreground">{t("signup.passwordHint") || "Use at least 8 characters."}</p>
        </div>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (t("signup.creating") || "Creating account...") : (t("signup.createAccount") || "Create account")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("signup.agreeText") || "By continuing, you agree to our"}{" "}
          <Link to="/terms" className="underline">{t("signup.terms") || "Terms"}</Link> {t("signup.and") || "and"}{" "}
          <Link to="/privacy" className="underline">{t("signup.privacy") || "Privacy Policy"}</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
