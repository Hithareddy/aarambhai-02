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
import { Bot, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUpdateTutorName } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";

interface TutorSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTutorName?: string;
}

const PRESET_NAMES = ["Mira", "Aria", "Leo", "Maya"];

export function TutorSetupModal({ open, onOpenChange, currentTutorName = "Mira" }: TutorSetupModalProps) {
  const { t } = useLanguage();
  const updateNameMutation = useUpdateTutorName();

  const [tutorNameInput, setTutorNameInput] = useState<string>(currentTutorName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTutorNameInput(currentTutorName);
      setErrorMsg(null);
    }
  }, [open, currentTutorName]);

  const handleSave = async () => {
    setErrorMsg(null);
    const trimmed = tutorNameInput.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a valid name for your tutor.");
      return;
    }
    if (trimmed.length > 50) {
      setErrorMsg("Tutor name must be under 50 characters.");
      return;
    }

    try {
      await updateNameMutation.mutateAsync(trimmed);
      toast.success(`Tutor named "${trimmed}"!`);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update tutor name.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Bot className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display text-xl font-bold">
            Meet your AI Tutor ✨
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            What would you like to call your personal learning companion?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESET_NAMES.map((name) => {
              const isSelected = tutorNameInput.trim().toLowerCase() === name.toLowerCase();
              return (
                <Button
                  key={name}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTutorNameInput(name);
                    setErrorMsg(null);
                  }}
                  className="h-8 text-xs font-semibold"
                >
                  {name}
                </Button>
              );
            })}
          </div>

          {/* Custom Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Tutor Name</span>
            </label>
            <Input
              value={tutorNameInput}
              onChange={(e) => {
                setTutorNameInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Enter custom tutor name..."
              className="h-10 text-xs"
              maxLength={50}
            />
          </div>

          {/* Validation Alert */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!tutorNameInput.trim() || updateNameMutation.isPending}
          >
            {updateNameMutation.isPending ? "Saving…" : "Save Name"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
