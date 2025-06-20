import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatsCardVariant =
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
    title: "text-blue-900 dark:text-blue-100",
    iconBg: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-900 dark:text-blue-100",
    description: "text-blue-700 dark:text-blue-300",
  },
  green: {
    card: "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800",
    title: "text-green-900 dark:text-green-100",
    iconBg: "bg-green-500/10",
    icon: "text-green-600 dark:text-green-400",
    value: "text-green-900 dark:text-green-100",
    description: "text-green-700 dark:text-green-300",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
    title: "text-purple-900 dark:text-purple-100",
    iconBg: "bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-100",
    description: "text-purple-700 dark:text-purple-300",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800",
    title: "text-orange-900 dark:text-orange-100",
    iconBg: "bg-orange-500/10",
    icon: "text-orange-600 dark:text-orange-400",
    value: "text-orange-900 dark:text-orange-100",
    description: "text-orange-700 dark:text-orange-300",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800",
    title: "text-red-900 dark:text-red-100",
    iconBg: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-900 dark:text-red-100",
    description: "text-red-700 dark:text-red-300",
  },
  indigo: {
    card: "bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    title: "text-indigo-900 dark:text-indigo-100",
    iconBg: "bg-indigo-500/10",
    icon: "text-indigo-600 dark:text-indigo-400",
    value: "text-indigo-900 dark:text-indigo-100",
    description: "text-indigo-700 dark:text-indigo-300",
  },
  pink: {
    card: "bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/20 border-pink-200 dark:border-pink-800",
    title: "text-pink-900 dark:text-pink-100",
    iconBg: "bg-pink-500/10",
    icon: "text-pink-600 dark:text-pink-400",
    value: "text-pink-900 dark:text-pink-100",
    description: "text-pink-700 dark:text-pink-300",
  },
  yellow: {
    card: "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    title: "text-yellow-900 dark:text-yellow-100",
    iconBg: "bg-yellow-500/10",
    icon: "text-yellow-600 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-yellow-100",
    description: "text-yellow-700 dark:text-yellow-300",
  },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: StatsCardVariant;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "blue",
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", styles.title)}>
          {title}
        </CardTitle>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            styles.iconBg
          )}
        >
          <Icon className={cn("h-4 w-4", styles.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
        {description && (
          <p className={cn("text-xs", styles.description)}>{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
