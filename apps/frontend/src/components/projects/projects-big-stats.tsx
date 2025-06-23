"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import {
  Folder,
  Users,
  Clock,
  Building2,
  TrendingUp,
  Target,
} from "lucide-react";
import { useProjects } from "@/services/projects";
import { useClients } from "@/services/clients";
import { useTranslations } from "next-intl";

interface ProjectsBigStatsProps {
  className?: string;
  isRefetching?: boolean;
  selectedClientId?: string;
}

export function ProjectsBigStats({
  className,
  isRefetching = false,
  selectedClientId,
}: ProjectsBigStatsProps) {
  const t = useTranslations("projects");
  const { data: projects = [] } = useProjects(
    selectedClientId === "all" ? undefined : selectedClientId
  );
  const { data: clients = [] } = useClients();

  // Calculate insights
  const totalProjects = projects.length;
  const totalWorkHours = projects.reduce(
    (sum, project) => sum + project._count.workHours,
    0
  );
  const projectsWithWork = projects.filter(
    (project) => project._count.workHours > 0
  ).length;
  const uniqueClients = new Set(projects.map((project) => project.clientId))
    .size;

  const averageHoursPerProject =
    totalProjects > 0 ? totalWorkHours / totalProjects : 0;

  const projectUtilizationRate =
    totalProjects > 0 ? (projectsWithWork / totalProjects) * 100 : 0;

  // Determine project portfolio health
  const getPortfolioHealth = () => {
    if (totalProjects >= 15 && projectUtilizationRate >= 70)
      return t("portfolioHealthExcellent");
    if (totalProjects >= 8 && projectUtilizationRate >= 50)
      return t("portfolioHealthGood");
    if (totalProjects >= 3 && projectUtilizationRate >= 30)
      return t("portfolioHealthGrowing");
    return t("portfolioHealthStarting");
  };

  const getProjectFocus = () => {
    if (uniqueClients === 0) return t("focusNoFocus");
    const avgProjectsPerClient = totalProjects / uniqueClients;
    if (avgProjectsPerClient >= 3) return t("focusDeepClientWork");
    if (avgProjectsPerClient >= 1.5) return t("focusBalanced");
    return t("focusClientDiversity");
  };

  // Stats for the display
  const statsItems: BigStatItem[] = [
    {
      title: t("avgHoursPerProject"),
      value: averageHoursPerProject.toFixed(1),
      description: t("workHoursPerProject"),
      icon: Clock,
    },
    {
      title: t("utilizationRate"),
      value: `${projectUtilizationRate.toFixed(0)}%`,
      description: t("projectsWithWorkHours"),
      icon: TrendingUp,
    },
    {
      title: t("projectFocus"),
      value: getProjectFocus(),
      description: t("acrossClients", { count: uniqueClients }),
      icon: Building2,
    },
  ];

  // Extra content with project insights
  const extraContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-indigo-100/50 dark:bg-indigo-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
            {t("portfolioGoal")}
          </span>
        </div>
        <div className="text-sm text-indigo-900 dark:text-indigo-100 mb-2">
          {totalProjects < 5
            ? t("createMoreProjects")
            : totalProjects < 12
              ? t("goodProjectPortfolio")
              : t("excellentPortfolio")}
        </div>
        <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((totalProjects / 15) * 100, 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
          {t("targetProjects", { current: Math.min(totalProjects, 15) })}
        </p>
      </div>

      <div className="bg-indigo-100/50 dark:bg-indigo-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
            {t("organizationLevel")}
          </span>
        </div>
        <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
          {getPortfolioHealth()}
        </div>
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          {t("activeProjects", {
            active: projectsWithWork,
            total: totalProjects,
          })}
        </p>
      </div>
    </div>
  );

  return (
    <BigStatsDisplay
      title={t("title")}
      subtitle={t("subtitle")}
      icon={Folder}
      mainValue={totalProjects}
      secondaryValue={`${totalWorkHours} ${t("totalWorkHours")} • ${uniqueClients} ${t("clientsInvolved")}`}
      stats={statsItems}
      variant="indigo"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
