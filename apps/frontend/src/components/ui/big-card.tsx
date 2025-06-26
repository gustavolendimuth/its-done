import { LucideIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface BigCardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export interface BigCardStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export interface BigCardContactInfo {
  icon: LucideIcon;
  value: string;
}

interface BigCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  contactInfo?: BigCardContactInfo[];
  stats?: BigCardStat[];
  actions?: BigCardAction[];
  onClick?: () => void;
  className?: string;
  accentColor?:
    | "primary"
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "indigo"
    | "pink"
    | "yellow";
  isLoading?: boolean;
}

const accentColorStyles = {
  primary: "bg-primary",
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
};

export function BigCard({
  title,
  subtitle,
  icon: Icon,
  contactInfo = [],
  stats = [],
  actions = [],
  onClick,
  className,
  accentColor = "primary",
  isLoading = false,
}: BigCardProps) {
  const hasInteraction = onClick || actions.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden group relative transition-all duration-200",
        hasInteraction && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div className={cn("h-2", accentColorStyles[accentColor])} />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold",
                accentColorStyles[accentColor]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions.length > 0 && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        {contactInfo.length > 0 && (
          <div className="space-y-2">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <info.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{info.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div
            className={cn(
              "grid gap-4 pt-4",
              contactInfo.length > 0 && "border-t",
              stats.length === 2 && "grid-cols-2",
              stats.length === 3 && "grid-cols-3",
              stats.length === 4 && "grid-cols-2",
              stats.length > 4 && "grid-cols-3"
            )}
          >
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
