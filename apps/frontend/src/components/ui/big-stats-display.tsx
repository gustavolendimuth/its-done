"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type BigStatsVariant =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "indigo"
  | "pink"
  | "yellow";

const variantStyles = {
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-100",
    subtitle: "text-blue-700 dark:text-blue-300",
    mainValue: "text-blue-900 dark:text-blue-100",
    statCard: "bg-blue-100/50 dark:bg-blue-800/20",
    statTitle: "text-blue-900 dark:text-blue-100",
    statValue: "text-blue-900 dark:text-blue-100",
    statDescription: "text-blue-700 dark:text-blue-300",
    statIcon: "text-blue-600 dark:text-blue-400",
    loadingSpinner: "border-blue-500",
  },
  green: {
    card: "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800",
    iconBg: "bg-green-500/10",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-900 dark:text-green-100",
    subtitle: "text-green-700 dark:text-green-300",
    mainValue: "text-green-900 dark:text-green-100",
    statCard: "bg-green-100/50 dark:bg-green-800/20",
    statTitle: "text-green-900 dark:text-green-100",
    statValue: "text-green-900 dark:text-green-100",
    statDescription: "text-green-700 dark:text-green-300",
    statIcon: "text-green-600 dark:text-green-400",
    loadingSpinner: "border-green-500",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
    title: "text-purple-900 dark:text-purple-100",
    subtitle: "text-purple-700 dark:text-purple-300",
    mainValue: "text-purple-900 dark:text-purple-100",
    statCard: "bg-purple-100/50 dark:bg-purple-800/20",
    statTitle: "text-purple-900 dark:text-purple-100",
    statValue: "text-purple-900 dark:text-purple-100",
    statDescription: "text-purple-700 dark:text-purple-300",
    statIcon: "text-purple-600 dark:text-purple-400",
    loadingSpinner: "border-purple-500",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800",
    iconBg: "bg-orange-500/10",
    icon: "text-orange-600 dark:text-orange-400",
    title: "text-orange-900 dark:text-orange-100",
    subtitle: "text-orange-700 dark:text-orange-300",
    mainValue: "text-orange-900 dark:text-orange-100",
    statCard: "bg-orange-100/50 dark:bg-orange-800/20",
    statTitle: "text-orange-900 dark:text-orange-100",
    statValue: "text-orange-900 dark:text-orange-100",
    statDescription: "text-orange-700 dark:text-orange-300",
    statIcon: "text-orange-600 dark:text-orange-400",
    loadingSpinner: "border-orange-500",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800",
    iconBg: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-900 dark:text-red-100",
    subtitle: "text-red-700 dark:text-red-300",
    mainValue: "text-red-900 dark:text-red-100",
    statCard: "bg-red-100/50 dark:bg-red-800/20",
    statTitle: "text-red-900 dark:text-red-100",
    statValue: "text-red-900 dark:text-red-100",
    statDescription: "text-red-700 dark:text-red-300",
    statIcon: "text-red-600 dark:text-red-400",
    loadingSpinner: "border-red-500",
  },
  indigo: {
    card: "bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    iconBg: "bg-indigo-500/10",
    icon: "text-indigo-600 dark:text-indigo-400",
    title: "text-indigo-900 dark:text-indigo-100",
    subtitle: "text-indigo-700 dark:text-indigo-300",
    mainValue: "text-indigo-900 dark:text-indigo-100",
    statCard: "bg-indigo-100/50 dark:bg-indigo-800/20",
    statTitle: "text-indigo-900 dark:text-indigo-100",
    statValue: "text-indigo-900 dark:text-indigo-100",
    statDescription: "text-indigo-700 dark:text-indigo-300",
    statIcon: "text-indigo-600 dark:text-indigo-400",
    loadingSpinner: "border-indigo-500",
  },
  pink: {
    card: "bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/20 border-pink-200 dark:border-pink-800",
    iconBg: "bg-pink-500/10",
    icon: "text-pink-600 dark:text-pink-400",
    title: "text-pink-900 dark:text-pink-100",
    subtitle: "text-pink-700 dark:text-pink-300",
    mainValue: "text-pink-900 dark:text-pink-100",
    statCard: "bg-pink-100/50 dark:bg-pink-800/20",
    statTitle: "text-pink-900 dark:text-pink-100",
    statValue: "text-pink-900 dark:text-pink-100",
    statDescription: "text-pink-700 dark:text-pink-300",
    statIcon: "text-pink-600 dark:text-pink-400",
    loadingSpinner: "border-pink-500",
  },
  yellow: {
    card: "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    iconBg: "bg-yellow-500/10",
    icon: "text-yellow-600 dark:text-yellow-400",
    title: "text-yellow-900 dark:text-yellow-100",
    subtitle: "text-yellow-700 dark:text-yellow-300",
    mainValue: "text-yellow-900 dark:text-yellow-100",
    statCard: "bg-yellow-100/50 dark:bg-yellow-800/20",
    statTitle: "text-yellow-900 dark:text-yellow-100",
    statValue: "text-yellow-900 dark:text-yellow-100",
    statDescription: "text-yellow-700 dark:text-yellow-300",
    statIcon: "text-yellow-600 dark:text-yellow-400",
    loadingSpinner: "border-yellow-500",
  },
};

export interface BigStatItem {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

export interface BigStatsDisplayProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  mainValue: string | number;
  secondaryValue?: string;
  stats: BigStatItem[];
  variant?: BigStatsVariant;
  isRefetching?: boolean;
  className?: string;
  extraContent?: ReactNode; // Para conteúdo adicional como Weekly Projection
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant,
}: BigStatItem & { variant: BigStatsVariant }) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-lg p-3", styles.statCard)}>
      <div className="flex items-center space-x-2 mb-1">
        <Icon className={cn("h-4 w-4", styles.statIcon)} />
        <span className={cn("text-sm font-medium", styles.statTitle)}>
          {title}
        </span>
      </div>
      <div className={cn("text-xl font-bold", styles.statValue)}>{value}</div>
      <p className={cn("text-xs", styles.statDescription)}>{description}</p>
    </div>
  );
}

export function BigStatsDisplay({
  title,
  subtitle,
  icon: Icon,
  mainValue,
  secondaryValue,
  stats,
  variant = "blue",
  isRefetching = false,
  className,
  extraContent,
}: BigStatsDisplayProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, "shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                styles.iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", styles.icon)} />
            </div>
            <div>
              <CardTitle className={cn("text-lg font-semibold", styles.title)}>
                {title}
              </CardTitle>
              {subtitle && (
                <p className={cn("text-sm", styles.subtitle)}>{subtitle}</p>
              )}
            </div>
          </div>
          {/* Subtle loading indicator during refetch */}
          {isRefetching && (
            <div className={cn("flex items-center space-x-2", styles.icon)}>
              <div
                className={cn(
                  "animate-spin rounded-full h-4 w-4 border-b-2",
                  styles.loadingSpinner
                )}
              ></div>
              <span className="text-xs font-medium">Updating...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main value */}
        <div className="text-center py-4">
          <div
            className={cn(
              "text-4xl md:text-5xl font-bold mb-2",
              styles.mainValue
            )}
          >
            {mainValue}
          </div>
          {secondaryValue && (
            <p className={cn("text-sm", styles.subtitle)}>{secondaryValue}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} variant={variant} />
          ))}
        </div>

        {/* Extra content (like Weekly Projection) */}
        {extraContent && <div className="space-y-4">{extraContent}</div>}
      </CardContent>
    </Card>
  );
}
