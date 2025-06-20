"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  CalendarDays,
} from "lucide-react";
import { useWorkHoursStats } from "@/services/work-hours-stats";
import { useTotalHours } from "@/services/time-entries";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-brand-green-100/50 dark:bg-brand-green-800/20 rounded-lg p-3",
        className
      )}
    >
      <div className="flex items-center space-x-2 mb-1">
        <Icon className="h-4 w-4 text-brand-green-600 dark:text-brand-green-400" />
        <span className="text-sm font-medium text-brand-green-900 dark:text-brand-green-100">
          {title}
        </span>
      </div>
      <div className="text-xl font-bold text-brand-green-900 dark:text-brand-green-100">
        {value}
      </div>
      <p className="text-xs text-brand-green-700 dark:text-brand-green-300">
        {description}
      </p>
    </div>
  );
}

interface TotalHoursDisplayProps {
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  clientId?: string;
  hourlyRate?: number;
  className?: string;
  workHours?: any[]; // Array of work hours to calculate worked days
  isRefetching?: boolean; // New prop to show loading only during refetch
}

export function TotalHoursDisplay({
  dateRange,
  clientId,
  hourlyRate = 50,
  className,
  workHours = [],
  isRefetching = false,
}: TotalHoursDisplayProps) {
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
  const { data: periodStats, isLoading: isPeriodLoading } =
    useWorkHoursStats(queryParams);

  // Total stats (without date filters)
  const { data: totalStats, isLoading: isTotalLoading } = useWorkHoursStats({
    clientId: clientId !== "all" ? clientId : undefined,
  });

  // Total hours specific to the period
  const { data: totalHoursPeriod, isLoading: isTotalHoursLoading } =
    useTotalHours(
      dateRange?.startDate || new Date(),
      dateRange?.endDate || new Date()
    );

  // Only show green loading spinner during refetch, not initial load
  const showLoading = isRefetching;

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

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-brand-green-50 to-brand-green-100/50 dark:from-brand-green-950/20 dark:to-brand-green-900/20 border-brand-green-200 dark:border-brand-green-800 shadow-lg",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-brand-green-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-brand-green-600 dark:text-brand-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-brand-green-900 dark:text-brand-green-100">
                Total Work Hours
              </CardTitle>
              <p className="text-sm text-brand-green-700 dark:text-brand-green-300">
                {isFiltered ? "Selected period" : "All time"}
              </p>
            </div>
          </div>
          {/* Subtle loading indicator during refetch */}
          {showLoading && (
            <div className="flex items-center space-x-2 text-brand-green-600 dark:text-brand-green-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green-500"></div>
              <span className="text-xs font-medium">Updating...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Always show content, just with loading indicator in header */}
        <>
          {/* Main value */}
          <div className="text-center py-4">
            <div className="text-4xl md:text-5xl font-bold text-brand-green-900 dark:text-brand-green-100 mb-2">
              {formatHoursToHHMM(periodHours)}
            </div>
            {isFiltered && allTimeHours > periodHours && (
              <p className="text-sm text-brand-green-700 dark:text-brand-green-300">
                All time total: {formatHoursToHHMM(allTimeHours)}
              </p>
            )}
          </div>

          {/* First line - Incorporated stats + Estimated Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Active Clients"
              value={String(activeClients)}
              description="in selected period"
              icon={Users}
            />

            <StatCard
              title="Days Worked"
              value={String(workedDays)}
              description="unique days in period"
              icon={CalendarDays}
            />

            <StatCard
              title="Estimated Value"
              value={`$${estimatedValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`}
              description={`@ $${hourlyRate}/hour`}
              icon={DollarSign}
            />
          </div>

          {/* Second line - Daily Average + Weekly Projection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Daily Average"
              value={formatHoursToHHMM(averagePerDay)}
              description="per working day"
              icon={Calendar}
            />

            {/* Weekly projection indicator */}
            {isFiltered && averagePerDay > 0 && (
              <div className="bg-brand-green-100/50 dark:bg-brand-green-800/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-brand-green-600 dark:text-brand-green-400" />
                    <span className="text-sm font-medium text-brand-green-900 dark:text-brand-green-100">
                      Weekly Projection
                    </span>
                  </div>
                  <span className="text-sm font-bold text-brand-green-900 dark:text-brand-green-100">
                    {formatHoursToHHMM(averagePerDay * 7)}/week
                  </span>
                </div>
                <div className="w-full bg-brand-green-200 dark:bg-brand-green-800 rounded-full h-2">
                  <div
                    className="bg-brand-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((averagePerDay / 8) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-brand-green-700 dark:text-brand-green-300 mt-1">
                  Target: 8h/day • {((averagePerDay / 8) * 100).toFixed(0)}% of
                  daily target
                </p>
              </div>
            )}
          </div>
        </>
      </CardContent>
    </Card>
  );
}
