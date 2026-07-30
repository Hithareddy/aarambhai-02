import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Target,
  BookOpen,
  ClipboardCheck,
  Gamepad2,
  Bot,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMonthActivity } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";
import type { DailyActivityRecord } from "@/lib/api/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatMinutes(seconds: number): string {
  const min = Math.floor(seconds / 60);
  return `${min} min`;
}

export function LearningCalendar() {
  const { t } = useLanguage();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDayRecord, setSelectedDayRecord] = useState<DailyActivityRecord | null>(null);

  const { data: monthData, isLoading } = useMonthActivity(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Calculate Monday-first calendar offset (0 = Mon, 6 = Sun)
  const rawFirstDay = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun
  const firstDayOfMonth = (rawFirstDay + 6) % 7; // Convert to Mon=0 .. Sun=6
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const recordMap = new Map<string, DailyActivityRecord>();
  if (monthData?.daily_records) {
    for (const rec of monthData.daily_records) {
      recordMap.set(rec.activity_date, rec);
    }
  }

  return (
    <Card className="p-4 border border-border transition-all">
      {/* Compact Calendar Header */}
      <div className="flex items-center justify-between gap-1 pb-3 border-b border-border/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <h3 className="font-display text-sm font-semibold text-foreground truncate">
            {t("calendar.title") || "Learning Calendar"}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {t("calendar.today") || "Today"}
          </Button>
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="px-1.5 font-display text-[11px] font-bold min-w-[70px] text-center truncate">
              {MONTH_NAMES[currentMonth - 1].slice(0, 3)} {currentYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          {/* Weekday Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7 rounded-md bg-transparent" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const record = recordMap.get(dateStr);

              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;

              const eligibleSec = record
                ? record.assessment_seconds + record.lesson_seconds + record.game_seconds + record.ai_tutor_seconds
                : 0;
              const eligibleMin = Math.floor(eligibleSec / 60);
              const goalMin = record?.goal_minutes ?? monthData?.daily_records[0]?.goal_minutes ?? 20;

              const isCompleted = !isFuture && eligibleMin >= goalMin && eligibleMin > 0;
              const isPartial = !isFuture && eligibleMin > 0 && eligibleMin < goalMin;

              let cellStyle = "border-border/50 bg-card text-foreground hover:bg-accent/50";

              if (isFuture) {
                cellStyle = "border-transparent text-muted-foreground/30 opacity-40 cursor-default";
              } else if (isCompleted) {
                cellStyle = "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold hover:bg-emerald-500/25";
              } else if (isPartial) {
                cellStyle = "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold hover:bg-amber-500/25";
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    if (!isFuture) {
                      setSelectedDayRecord(
                        record || {
                          activity_date: dateStr,
                          total_active_seconds: 0,
                          assessment_seconds: 0,
                          lesson_seconds: 0,
                          game_seconds: 0,
                          ai_tutor_seconds: 0,
                          general_seconds: 0,
                          goal_minutes: goalMin,
                          goal_eligible_seconds: 0,
                          goal_completed: false,
                          bonus_learning_minutes: 0,
                        }
                      );
                    }
                  }}
                  disabled={isFuture}
                  className={`flex h-7 w-full items-center justify-center rounded-md border text-xs transition-all cursor-pointer ${cellStyle} ${
                    isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background font-black" : ""
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Legend Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Goal completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>No activity</span>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDayRecord && (
        <Dialog open={!!selectedDayRecord} onOpenChange={() => setSelectedDayRecord(null)}>
          <DialogContent className="sm:max-w-md border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {new Date(selectedDayRecord.activity_date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Daily active learning activity summary & historical goal status
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const eligibleSec =
                selectedDayRecord.assessment_seconds +
                selectedDayRecord.lesson_seconds +
                selectedDayRecord.game_seconds +
                selectedDayRecord.ai_tutor_seconds;
              const eligibleMin = Math.floor(eligibleSec / 60);
              const goalMin = selectedDayRecord.goal_minutes || 20;
              const isCompleted = eligibleMin >= goalMin && eligibleMin > 0;
              const isPartial = eligibleMin > 0 && eligibleMin < goalMin;

              return (
                <div className="space-y-4 py-2">
                  {/* Status Banner */}
                  <div
                    className={`rounded-xl border p-4 flex items-center justify-between ${
                      isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : isPartial
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-display text-sm font-bold">
                        <Target className="h-4 w-4 shrink-0" />
                        {isCompleted ? (
                          <span>🎉 Goal Completed</span>
                        ) : isPartial ? (
                          <span>Goal not completed</span>
                        ) : (
                          <span>No Activity Recorded</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 opacity-90">
                        {eligibleMin} / {goalMin} min active learning
                      </p>
                    </div>

                    {isCompleted && (
                      <Badge className="bg-emerald-500 text-white font-semibold">
                        +{(eligibleMin - goalMin)}m bonus
                      </Badge>
                    )}
                  </div>

                  {/* Active Learning Categories Breakdown */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Learning Category Breakdown
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 bg-card">
                        <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px]">Lessons</p>
                          <p className="font-semibold">{formatMinutes(selectedDayRecord.lesson_seconds)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 bg-card">
                        <ClipboardCheck className="h-4 w-4 text-purple-500 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px]">Assessment</p>
                          <p className="font-semibold">{formatMinutes(selectedDayRecord.assessment_seconds)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 bg-card">
                        <Gamepad2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px]">Games</p>
                          <p className="font-semibold">{formatMinutes(selectedDayRecord.game_seconds)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 bg-card">
                        <Bot className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[10px]">AI Tutor</p>
                          <p className="font-semibold">{formatMinutes(selectedDayRecord.ai_tutor_seconds)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Total Active Time:
                      </span>
                      <span className="font-bold text-foreground">
                        {formatMinutes(selectedDayRecord.total_active_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Extensible Future Slots */}
                  <div className="border-t border-border/60 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Daily Attendance Logged
                    </span>
                    <span>Historical Goal: {goalMin} min</span>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
