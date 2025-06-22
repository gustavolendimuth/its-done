"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import { Users, Clock, FileText, TrendingUp, Star, MapPin } from "lucide-react";
import { useClientStats } from "@/services/client-stats";
import { formatHoursToHHMM } from "@/lib/utils";

interface ClientsBigStatsProps {
  className?: string;
  isRefetching?: boolean;
}

export function ClientsBigStats({
  className,
  isRefetching = false,
}: ClientsBigStatsProps) {
  const { data: stats } = useClientStats();

  if (!stats) {
    return null;
  }

  // Calculate insights
  const averageHoursPerClient =
    stats.totalClients > 0 ? stats.totalHours / stats.totalClients : 0;

  const averageInvoicesPerClient =
    stats.totalClients > 0 ? stats.totalInvoices / stats.totalClients : 0;

  // Determine client engagement level
  const getEngagementLevel = () => {
    if (averageHoursPerClient >= 100) return "High";
    if (averageHoursPerClient >= 40) return "Medium";
    return "Low";
  };

  // Stats for the display
  const statsItems: BigStatItem[] = [
    {
      title: "Avg Hours/Client",
      value: formatHoursToHHMM(averageHoursPerClient),
      description: "per client relationship",
      icon: Clock,
    },
    {
      title: "Avg Invoices/Client",
      value: averageInvoicesPerClient.toFixed(1),
      description: "billing frequency",
      icon: FileText,
    },
    {
      title: "Client Engagement",
      value: getEngagementLevel(),
      description: "based on work volume",
      icon: Star,
    },
  ];

  // Extra content with client insights
  const extraContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-100/50 dark:bg-blue-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Growth Opportunity
          </span>
        </div>
        <div className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          {stats.totalClients < 5
            ? "Focus on acquiring new clients"
            : stats.totalClients < 15
              ? "Great client base - consider upselling"
              : "Excellent portfolio - optimize operations"}
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((stats.totalClients / 20) * 100, 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Target: 20 clients • {Math.min(stats.totalClients, 20)}/20
        </p>
      </div>

      <div className="bg-blue-100/50 dark:bg-blue-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Business Health
          </span>
        </div>
        <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
          {stats.totalHours > 500
            ? "Excellent"
            : stats.totalHours > 200
              ? "Good"
              : stats.totalHours > 50
                ? "Growing"
                : "Starting"}
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Based on {formatHoursToHHMM(stats.totalHours)} total hours
        </p>
      </div>
    </div>
  );

  return (
    <BigStatsDisplay
      title="Client Portfolio"
      subtitle="Your business relationships overview"
      icon={Users}
      mainValue={stats.totalClients}
      secondaryValue={`Managing ${formatHoursToHHMM(stats.totalHours)} of work`}
      stats={statsItems}
      variant="blue"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
