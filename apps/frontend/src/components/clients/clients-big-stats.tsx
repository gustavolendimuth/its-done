"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import { Users, Clock, FileText, TrendingUp, Star, MapPin } from "lucide-react";
import { useClientStats } from "@/services/client-stats";
import { formatHoursToHHMM } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ClientsBigStatsProps {
  className?: string;
  isRefetching?: boolean;
}

export function ClientsBigStats({
  className,
  isRefetching = false,
}: ClientsBigStatsProps) {
  const t = useTranslations("clients");
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
    if (averageHoursPerClient >= 100) return t("engagementHigh");
    if (averageHoursPerClient >= 40) return t("engagementMedium");
    return t("engagementLow");
  };

  // Stats for the display
  const statsItems: BigStatItem[] = [
    {
      title: t("avgHoursPerClient"),
      value: formatHoursToHHMM(averageHoursPerClient),
      description: t("perClientRelationship"),
      icon: Clock,
    },
    {
      title: t("avgInvoicesPerClient"),
      value: averageInvoicesPerClient.toFixed(1),
      description: t("billingFrequency"),
      icon: FileText,
    },
    {
      title: t("clientEngagement"),
      value: getEngagementLevel(),
      description: t("basedOnWorkVolume"),
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
            {t("growthOpportunity")}
          </span>
        </div>
        <div className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          {stats.totalClients < 5
            ? t("focusOnAcquiring")
            : stats.totalClients < 15
              ? t("greatClientBase")
              : t("excellentPortfolio")}
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
          {t("targetClients", { current: Math.min(stats.totalClients, 20) })}
        </p>
      </div>

      <div className="bg-blue-100/50 dark:bg-blue-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t("businessHealth")}
          </span>
        </div>
        <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
          {stats.totalHours > 500
            ? t("healthExcellent")
            : stats.totalHours > 200
              ? t("healthGood")
              : stats.totalHours > 50
                ? t("healthGrowing")
                : t("healthStarting")}
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {t("basedOnTotalHours", {
            hours: formatHoursToHHMM(stats.totalHours),
          })}
        </p>
      </div>
    </div>
  );

  return (
    <BigStatsDisplay
      title={t("title")}
      subtitle={t("subtitle")}
      icon={Users}
      mainValue={stats.totalClients}
      secondaryValue={t("managingWork", {
        hours: formatHoursToHHMM(stats.totalHours),
      })}
      stats={statsItems}
      variant="blue"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
