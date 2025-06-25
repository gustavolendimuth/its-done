import React from "react";
import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  info: {
    card: "bg-primary/5 border-primary/20",
    iconBg: "bg-primary/10",
    icon: "text-primary",
  },
  success: {
    card: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    iconBg: "bg-green-500/10",
    icon: "text-green-600 dark:text-green-400",
  },
  warning: {
    card: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
    iconBg: "bg-yellow-500/10",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  error: {
    card: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    iconBg: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function InfoCard({
  title,
  description,
  icon: Icon = Info,
  variant = "info",
  className,
}: InfoCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, className)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn("p-3 rounded-full", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
