import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityDay } from "@/lib/api/types";

interface LearningActivityCardProps {
  weeklyData: ActivityDay[];
  monthlyData: ActivityDay[];
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {payload[0].value}
        </span>
        {suffix}
      </p>
    </div>
  );
}

export function LearningActivityCard({ weeklyData, monthlyData }: LearningActivityCardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");

  // Weekly data processing
  const weeklyChart = weeklyData.map((d) => ({
    day: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    minutes: d.minutes,
  }));
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);

  // Monthly data processing
  const monthlyChart = monthlyData.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { day: "2-digit" }),
    minutes: d.minutes,
  }));
  const monthlyTotal = monthlyData.reduce((sum, d) => sum + d.minutes, 0);
  const activeDays = monthlyData.filter((d) => d.minutes > 0).length;

  return (
    <Card className="p-6">
      {/* Header with Title, Subtitle, Segmented Toggle & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">
              {t("dashboard.learningActivity") || "Learning Activity"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeTab === "week"
              ? t("dashboard.learningMinutesText", { minutes: String(weeklyTotal) }) ||
                `${weeklyTotal} minutes of learning across 7 days`
              : t("dashboard.activeDaysText", {
                  days: String(activeDays),
                  hours: String(Math.round(monthlyTotal / 60)),
                  minutes: String(monthlyTotal % 60),
                }) || `${activeDays} active days out of 28`}
          </p>
        </div>

        {/* Compact Segmented Control Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-muted p-1 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("week")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === "week"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dashboard.thisWeek") || "This Week"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("month")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === "month"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dashboard.last28Days") || "Last 28 Days"}
            </button>
          </div>

          <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
            {activeTab === "week"
              ? t("dashboard.minutesPerDay") || "Minutes / day"
              : t("dashboard.dailyMinutes") || "Daily minutes"}
          </Badge>
        </div>
      </div>

      {/* Single Dynamic Chart Container */}
      <div className="mt-5 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "week" ? (
            <AreaChart data={weeklyChart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="weekFillMerged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                width={30}
              />
              <Tooltip
                content={<ChartTooltip suffix={` ${t("dashboard.minSuffix") || "min"}`} />}
                cursor={{ stroke: "var(--color-border)" }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#weekFillMerged)"
              />
            </AreaChart>
          ) : (
            <BarChart data={monthlyChart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                interval={3}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                width={30}
              />
              <Tooltip
                content={<ChartTooltip suffix={` ${t("dashboard.minSuffix") || "min"}`} />}
                cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {monthlyChart.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.minutes > 0 ? "var(--color-primary)" : "var(--color-muted)"}
                    opacity={entry.minutes > 0 ? 0.85 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
