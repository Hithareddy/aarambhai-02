import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Monitor, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Aarambh AI" }] }),
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";

function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: Theme) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = t === "dark" || (t === "system" && prefersDark);
      root.classList.toggle("dark", dark);
    };
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Make Aarambh feel like yours"
        description="Everything here is optional. Change what feels right — you can always adjust later."
      />

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Choose the look that's easiest on your eyes.</p>
        <Separator className="my-4" />

        <div className="grid gap-6">
          <div>
            <Label>Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as Theme)}
              className="mt-2 grid gap-2 sm:grid-cols-3"
            >
              {[
                { v: "light", label: "Light", icon: Sun },
                { v: "dark", label: "Dark", icon: Moon },
                { v: "system", label: "System", icon: Monitor },
              ].map((t) => (
                <label
                  key={t.v}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                    theme === t.v ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  <RadioGroupItem value={t.v} />
                  <t.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <SelectRow
            label="Language"
            options={[
              ["en", "English"],
              ["te", "తెలుగు"],
              ["hi", "हिन्दी"],
              ["ta", "தமிழ்"],
              ["mr", "मराठी"],
            ]}
            defaultValue="en"
          />
          <SelectRow
            label="Font size"
            options={[
              ["sm", "Small"],
              ["md", "Medium"],
              ["lg", "Large"],
              ["xl", "Extra large"],
            ]}
            defaultValue="md"
          />
          <SelectRow
            label="Font style"
            options={[
              ["standard", "Standard"],
              ["easy", "Easy read"],
            ]}
            defaultValue="standard"
          />
          <SelectRow
            label="Contrast"
            options={[
              ["normal", "Normal"],
              ["high", "High contrast"],
            ]}
            defaultValue="normal"
          />
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Accessibility</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label="Audio support" hint="Read text aloud where available." defaultChecked />
          <ToggleRow label="Reduce motion" hint="Minimise animations and transitions." />
          <ToggleRow label="Large buttons" hint="Bigger tap targets across the app." />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label="Daily reminder" hint="A gentle nudge to practice." defaultChecked />
          <ToggleRow label="Weekly report" hint="A friendly summary every Sunday." defaultChecked />
          <ToggleRow label="New achievements" hint="Ping me when I earn a badge." />
        </div>
      </Card>

      {/* Privacy & Account */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Privacy & account</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label="Share anonymous learning data" hint="Helps us improve for everyone." />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline">Export my data</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Delete account
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={() => navigate({ to: "/login" })}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function SelectRow({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: [string, string][];
  defaultValue: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-center">
      <Label>{label}</Label>
      <Select defaultValue={defaultValue}>
        <SelectTrigger className="max-w-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
