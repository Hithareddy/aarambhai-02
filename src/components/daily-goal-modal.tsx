import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDailyGoal } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";

interface DailyGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoalMinutes?: number;
}

const PRESET_GOALS = [
  { minutes: 10, label: "Light", description: "10 min / day" },
  { minutes: 20, label: "Regular", description: "20 min / day" },
  { minutes: 30, label: "Focused", description: "30 min / day" },
  { minutes: 45, label: "Serious", description: "45 min / day" },
  { minutes: 60, label: "Intensive", description: "60 min / day" },
];

export function DailyGoalModal({ open, onOpenChange, currentGoalMinutes = 20 }: DailyGoalModalProps) {
  const { t } = useLanguage();
  const updateGoalMutation = useUpdateDailyGoal();

  const [selectedMinutes, setSelectedMinutes] = useState<number | "custom">(
    PRESET_GOALS.some((p) => p.minutes === currentGoalMinutes) ? currentGoalMinutes : "custom"
  );
  const [customInput, setCustomInput] = useState<string>(
    PRESET_GOALS.some((p) => p.minutes === currentGoalMinutes) ? "" : String(currentGoalMinutes)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const isPreset = PRESET_GOALS.some((p) => p.minutes === currentGoalMinutes);
      setSelectedMinutes(isPreset ? currentGoalMinutes : "custom");
      setCustomInput(isPreset ? "" : String(currentGoalMinutes));
      setValidationError(null);
    }
  }, [open, currentGoalMinutes]);

  const handleSave = async () => {
    setValidationError(null);
    let finalMinutes: number;

    if (selectedMinutes === "custom") {
      const trimmed = customInput.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) {
        setValidationError("Please enter a valid numeric goal (e.g. 15).");
        return;
      }

      finalMinutes = parseInt(trimmed, 10);
      if (isNaN(finalMinutes) || finalMinutes <= 0) {
        setValidationError("Daily goal must be at least 1 minute.");
        return;
      }
      if (finalMinutes > 480) {
        setValidationError("Daily goal cannot exceed 480 minutes (8 hours).");
        return;
      }
    } else {
      finalMinutes = selectedMinutes;
    }

    try {
      await updateGoalMutation.mutateAsync(finalMinutes);
      toast.success(t("dailyGoal.savedToast") || `Daily learning goal set to ${finalMinutes} minutes!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update daily goal.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Target className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display text-xl font-bold">
            🎯 {t("dailyGoal.modalTitle") || "Set your daily learning goal"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {t("dailyGoal.modalSubtitle") || "How much time would you like to learn each day?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESET_GOALS.map((preset) => {
              const isSelected = selectedMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(preset.minutes);
                    setValidationError(null);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <span className="font-display font-bold text-sm">{preset.minutes} min</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{preset.label}</span>
                </button>
              );
            })}

            {/* Custom Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedMinutes("custom");
                setValidationError(null);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                selectedMinutes === "custom"
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <span className="font-display font-bold text-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Custom
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Your choice</span>
            </button>
          </div>

          {/* Custom Input Field */}
          {selectedMinutes === "custom" && (
            <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-foreground">Custom Goal (Minutes)</label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={480}
                  placeholder="Enter minutes (e.g. 25)"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setValidationError(null);
                  }}
                  className="pr-12 h-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                  min
                </span>
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateGoalMutation.isPending}
            className="shadow-sm"
          >
            {updateGoalMutation.isPending ? "Saving…" : t("common.save") || "Save Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
