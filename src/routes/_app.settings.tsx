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
import { useLanguage } from "@/hooks/use-language";
import { getLearnerProfile, saveLearnerProfile } from "@/lib/api/learner";
import { toast } from "sonner";
import { LANGUAGES } from "@/constants/languages";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Aarambh AI" }] }),
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";

function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const { websiteLanguage, targetLanguage, setWebsiteLanguage, setTargetLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getLearnerProfile().then((prof) => {
      if (prof) {
        setProfile(prof);
      }
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: Theme) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = t === "dark" || (t === "system" && prefersDark);
      root.classList.toggle("dark", dark);
    };
    applyTheme(theme);
  }, [theme]);

  const handleWebsiteLanguageChange = async (val: string) => {
    // 1. Update context immediately
    setWebsiteLanguage(val as any);

    // 2. Persist to API if profile exists
    if (profile) {
      try {
        const updated = await saveLearnerProfile({
          name: profile.name,
          age_group: profile.age_group,
          educational_background: profile.educational_background,
          current_role: profile.current_role,
          learning_goal: profile.learning_goal,
          learning_language: profile.learning_language, // target language fallback
          website_language: val,
          current_familiarity: profile.current_familiarity,
          digital_comfort: profile.digital_comfort,
        });
        setProfile(updated);
        toast.success(t("settings.websiteLanguageUpdated") || "Website language updated successfully.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile on the server.");
      }
    }
  };

  const handleTargetLanguageChange = async (val: string) => {
    // 1. Update context immediately
    setTargetLanguage(val as any);

    // 2. Persist to API if profile exists
    if (profile) {
      try {
        const updated = await saveLearnerProfile({
          name: profile.name,
          age_group: profile.age_group,
          educational_background: profile.educational_background,
          current_role: profile.current_role,
          learning_goal: profile.learning_goal,
          learning_language: val, // target language
          website_language: profile.website_language || "en",
          current_familiarity: profile.current_familiarity,
          digital_comfort: profile.digital_comfort,
        });
        setProfile(updated);
        toast.success(t("settings.targetLanguageUpdated") || "Target language updated successfully.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile on the server.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("settings.headerEyebrow")}
        title={t("settings.headerTitle")}
        description={t("settings.headerDesc")}
      />

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">{t("settings.appearance")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.appearanceHint")}</p>
        <Separator className="my-4" />

        <div className="grid gap-6">
          <div>
            <Label>{t("settings.theme")}</Label>
            <RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as Theme)}
              className="mt-2 grid gap-2 sm:grid-cols-3"
            >
              {[
                { v: "light", label: t("settings.themeLight") || "Light", icon: Sun },
                { v: "dark", label: t("settings.themeDark") || "Dark", icon: Moon },
                { v: "system", label: t("settings.themeSystem") || "System", icon: Monitor },
              ].map((t) => (
                <label
                  key={t.v}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${theme === t.v ? "border-primary bg-primary-soft" : "border-border"
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
            label={t("settings.websiteLanguage")}
            options={LANGUAGES.map((l) => [l.code, l.native])}
            value={websiteLanguage}
            onValueChange={handleWebsiteLanguageChange}
          />
          <SelectRow
            label={t("settings.targetLanguage")}
            options={LANGUAGES.map((l) => [l.code, l.native])}
            value={targetLanguage}
            onValueChange={handleTargetLanguageChange}
          />
          <SelectRow
            label={t("settings.fontSize")}
            options={[
              ["sm", t("settings.fontSizeSm") || "Small"],
              ["md", t("settings.fontSizeMd") || "Medium"],
              ["lg", t("settings.fontSizeLg") || "Large"],
              ["xl", t("settings.fontSizeXl") || "Extra large"],
            ]}
            defaultValue="md"
          />
          <SelectRow
            label={t("settings.fontStyle")}
            options={[
              ["standard", t("settings.fontStyleStandard") || "Standard"],
              ["easy", t("settings.fontStyleEasy") || "Easy read"],
            ]}
            defaultValue="standard"
          />
          <SelectRow
            label={t("settings.contrast")}
            options={[
              ["normal", t("settings.contrastNormal") || "Normal"],
              ["high", t("settings.contrastHigh") || "High contrast"],
            ]}
            defaultValue="normal"
          />
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">{t("settings.accessibility")}</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label={t("settings.audioSupport")} hint={t("settings.audioSupportHint")} defaultChecked />
          <ToggleRow label={t("settings.reduceMotion")} hint={t("settings.reduceMotionHint")} />
          <ToggleRow label={t("settings.largeButtons")} hint={t("settings.largeButtonsHint")} />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">{t("settings.notifications")}</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label={t("settings.dailyReminder")} hint={t("settings.dailyReminderHint")} defaultChecked />
          <ToggleRow label={t("settings.weeklyReport")} hint={t("settings.weeklyReportHint")} defaultChecked />
          <ToggleRow label={t("settings.newAchievements")} hint={t("settings.newAchievementsHint")} />
        </div>
      </Card>

      {/* Privacy & Account */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">{t("settings.privacy")}</h2>
        <Separator className="my-4" />
        <div className="grid gap-4">
          <ToggleRow label={t("settings.shareData")} hint={t("settings.shareDataHint")} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline">{t("settings.exportData")}</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              {t("settings.deleteAccount")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={() => navigate({ to: "/login" })}>
          <LogOut className="h-4 w-4" /> {t("settings.logout")}
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
  value,
  onValueChange,
  defaultValue,
}: {
  label: string;
  options: [string, string][];
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-center">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} defaultValue={defaultValue}>
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
