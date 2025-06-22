"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Activity,
  Zap,
} from "lucide-react";
import { useDashboardStats } from "@/services/dashboard";
import { formatHoursToHHMM } from "@/lib/utils";

interface AnalyticsBigStatsProps {
  className?: string;
  isRefetching?: boolean;
}

export function AnalyticsBigStats({
  className,
  isRefetching = false,
}: AnalyticsBigStatsProps) {
  const { data: stats } = useDashboardStats();

  if (!stats) {
    return null;
  }

  // Calculate advanced insights
  const productivityScore = (() => {
    let score = 0;

    // Hours factor (0-40 points)
    if (stats.thisMonthHours >= 160) score += 40;
    else if (stats.thisMonthHours >= 120) score += 30;
    else if (stats.thisMonthHours >= 80) score += 20;
    else if (stats.thisMonthHours >= 40) score += 10;

    // Growth factor (0-30 points)
    if (stats.hoursGrowth !== undefined) {
      if (stats.hoursGrowth >= 20) score += 30;
      else if (stats.hoursGrowth >= 10) score += 20;
      else if (stats.hoursGrowth >= 0) score += 10;
    }

    // Client diversity factor (0-30 points)
    if (stats.totalClients >= 10) score += 30;
    else if (stats.totalClients >= 5) score += 20;
    else if (stats.totalClients >= 3) score += 10;

    return Math.min(score, 100);
  })();

  const getPerformanceLevel = () => {
    if (productivityScore >= 80) return "Excellent";
    if (productivityScore >= 60) return "Good";
    if (productivityScore >= 40) return "Average";
    return "Needs Focus";
  };

  const getGrowthTrend = () => {
    if (stats.hoursGrowth === undefined) return "N/A";
    if (stats.hoursGrowth > 15) return "Accelerating";
    if (stats.hoursGrowth > 5) return "Growing";
    if (stats.hoursGrowth > -5) return "Stable";
    return "Declining";
  };

  // Calculate efficiency metrics
  const hoursPerClient =
    stats.totalClients > 0 ? stats.totalHours / stats.totalClients : 0;

  const invoicesPerClient =
    stats.totalClients > 0 ? stats.totalInvoices / stats.totalClients : 0;

  // Stats for the display
  const statsItems: BigStatItem[] = [
    {
      title: "Productivity Score",
      value: `${productivityScore}/100`,
      description: getPerformanceLevel().toLowerCase(),
      icon: Award,
    },
    {
      title: "Growth Trend",
      value: getGrowthTrend(),
      description: `${stats.hoursGrowth?.toFixed(1) || "0"}% this month`,
      icon: TrendingUp,
    },
    {
      title: "Efficiency Ratio",
      value: `${hoursPerClient.toFixed(1)}h`,
      description: "hours per client",
      icon: Zap,
    },
  ];

  // Extra content with advanced analytics
  const extraContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-orange-100/50 dark:bg-orange-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Monthly Target
          </span>
        </div>
        <div className="text-sm text-orange-900 dark:text-orange-100 mb-2">
          {stats.thisMonthHours >= 160
            ? "Target exceeded! Great work!"
            : `${(160 - stats.thisMonthHours).toFixed(0)}h to reach 160h target`}
        </div>
        <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((stats.thisMonthHours / 160) * 100, 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
          Progress: {formatHoursToHHMM(stats.thisMonthHours)}/160h •{" "}
          {((stats.thisMonthHours / 160) * 100).toFixed(0)}%
        </p>
      </div>

      <div className="bg-orange-100/50 dark:bg-orange-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Business Maturity
          </span>
        </div>
        <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
          {stats.totalClients >= 15 && stats.totalHours >= 500
            ? "Mature"
            : stats.totalClients >= 8 && stats.totalHours >= 200
              ? "Established"
              : stats.totalClients >= 3 && stats.totalHours >= 50
                ? "Growing"
                : "Startup"}
        </div>
        <p className="text-xs text-orange-700 dark:text-orange-300">
          {stats.totalClients} clients • {formatHoursToHHMM(stats.totalHours)}
        </p>
      </div>
    </div>
  );

  return (
    <BigStatsDisplay
      title="Performance Analytics"
      subtitle="Advanced business insights"
      icon={BarChart3}
      mainValue={formatHoursToHHMM(stats.totalHours)}
      secondaryValue={`${stats.totalClients} clients • ${stats.totalInvoices} invoices`}
      stats={statsItems}
      variant="orange"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
