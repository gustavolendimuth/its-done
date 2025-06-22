"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import {
  Clock,
  Users,
  CalendarDays,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useWorkHoursStats } from "@/services/work-hours-stats";
import { useTotalHours } from "@/services/time-entries";
import { formatHoursToHHMM, cn } from "@/lib/utils";

interface WorkHoursBigStatsProps {
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  clientId?: string;
  hourlyRate?: number;
  className?: string;
  workHours?: any[];
  isRefetching?: boolean;
}

export function WorkHoursBigStats({
  dateRange,
  clientId,
  hourlyRate = 50,
  className,
  workHours = [],
  isRefetching = false,
}: WorkHoursBigStatsProps) {
  // Query parameters
  const queryParams =
    dateRange?.startDate && dateRange?.endDate
      ? {
          from: dateRange.startDate.toISOString(),
          to: dateRange.endDate.toISOString(),
          clientId: clientId !== "all" ? clientId : undefined,
        }
      : undefined;

  // Selected period stats
  const { data: periodStats } = useWorkHoursStats(queryParams);

  // Total stats (without date filters)
  const { data: totalStats } = useWorkHoursStats({
    clientId: clientId !== "all" ? clientId : undefined,
  });

  // Values for display
  const periodHours = periodStats?.totalHours || 0;
  const allTimeHours = totalStats?.totalHours || 0;
  const estimatedValue = periodHours * hourlyRate;
  const averagePerDay = periodStats?.averageHoursPerDay || 0;
  const activeClients = periodStats?.activeClients || 0;

  // Calculate unique worked days
  const workedDays =
    workHours.length > 0
      ? new Set(workHours.map((wh) => new Date(wh.date).toDateString())).size
      : 0;

  // Determine if we're showing a specific period or everything
  const isFiltered = !!queryParams;

  // Stats for the display
  const stats: BigStatItem[] = [
    {
      title: "Active Clients",
      value: String(activeClients),
      description: "in selected period",
      icon: Users,
    },
    {
      title: "Days Worked",
      value: String(workedDays),
      description: "unique days in period",
      icon: CalendarDays,
    },
    {
      title: "Estimated Value",
      value: `$${estimatedValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
      description: `@ $${hourlyRate}/hour`,
      icon: DollarSign,
    },
  ];

  // Extra content for weekly projection
  const extraContent =
    isFiltered && averagePerDay > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-100/50 dark:bg-green-800/20 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Daily Average
            </span>
          </div>
          <div className="text-xl font-bold text-green-900 dark:text-green-100">
            {formatHoursToHHMM(averagePerDay)}
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">
            per working day
          </p>
        </div>

        <div className="bg-green-100/50 dark:bg-green-800/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Weekly Projection
              </span>
            </div>
            <span className="text-sm font-bold text-green-900 dark:text-green-100">
              {formatHoursToHHMM(averagePerDay * 7)}/week
            </span>
          </div>
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((averagePerDay / 8) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Target: 8h/day • {((averagePerDay / 8) * 100).toFixed(0)}% of daily
            target
          </p>
        </div>
      </div>
    ) : null;

  return (
    <BigStatsDisplay
      title="Total Work Hours"
      subtitle={isFiltered ? "Selected period" : "All time"}
      icon={Clock}
      mainValue={formatHoursToHHMM(periodHours)}
      secondaryValue={
        isFiltered && allTimeHours > periodHours
          ? `All time total: ${formatHoursToHHMM(allTimeHours)}`
          : undefined
      }
      stats={stats}
      variant="green"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
