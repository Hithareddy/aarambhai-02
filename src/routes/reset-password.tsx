import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Aarambh AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you'll remember."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/login" });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="new">New password</Label>
          <div className="relative">
            <Input id="new" type={show ? "text" : "password"} required minLength={8} />
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
        <div className="grid gap-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type={show ? "text" : "password"} required minLength={8} />
        </div>
        <Button type="submit" size="lg">Update password</Button>
      </form>
    </AuthShell>
  );
}
