"use client";

import { Clock, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { useWorkHoursStats } from "@/services/work-hours-stats";

interface TotalHoursSummaryProps {
  className?: string;
  showTrend?: boolean;
}

export function TotalHoursSummary({
  className,
  showTrend = true,
}: TotalHoursSummaryProps) {
  // Stats do mês atual
  const currentMonth = new Date();
  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const { data: monthStats, isLoading: isMonthLoading } = useWorkHoursStats({
    from: startOfMonth.toISOString(),
    to: endOfMonth.toISOString(),
  });

  // Stats do mês anterior para comparação
  const previousMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() - 1,
    1
  );
  const endOfPreviousMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    0
  );

  const { data: previousMonthStats, isLoading: isPreviousLoading } =
    useWorkHoursStats({
      from: previousMonth.toISOString(),
      to: endOfPreviousMonth.toISOString(),
    });

  // Total geral
  const { data: totalStats, isLoading: isTotalLoading } = useWorkHoursStats();

  const isLoading = isMonthLoading || isPreviousLoading || isTotalLoading;

  // Cálculos
  const currentHours = monthStats?.totalHours || 0;
  const previousHours = previousMonthStats?.totalHours || 0;
  const totalHours = totalStats?.totalHours || 0;

  const trend =
    previousHours > 0
      ? ((currentHours - previousHours) / previousHours) * 100
      : 0;

  const isTrendPositive = trend > 0;

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-brand-green-50 to-brand-green-100/50 dark:from-brand-green-950/20 dark:to-brand-green-900/20 border-brand-green-200 dark:border-brand-green-800",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-brand-green-900 dark:text-brand-green-100">
          Total de Horas
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-brand-green-500/10 flex items-center justify-center">
          <Clock className="h-4 w-4 text-brand-green-600 dark:text-brand-green-400" />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green-500"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-brand-green-900 dark:text-brand-green-100">
              {formatHoursToHHMM(currentHours)}
            </div>
            <p className="text-xs text-brand-green-700 dark:text-brand-green-300 mb-2">
              este mês
            </p>

            {showTrend && previousHours > 0 && (
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp
                  className={cn(
                    "h-3 w-3",
                    isTrendPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400 rotate-180"
                  )}
                />
                <span
                  className={cn(
                    "font-medium",
                    isTrendPositive
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  )}
                >
                  {Math.abs(trend).toFixed(1)}%
                </span>
                <span className="text-brand-green-600 dark:text-brand-green-400">
                  vs mês anterior
                </span>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-brand-green-200 dark:border-brand-green-800">
              <div className="text-xs text-brand-green-700 dark:text-brand-green-300">
                Total geral:{" "}
                <span className="font-medium">
                  {formatHoursToHHMM(totalHours)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
