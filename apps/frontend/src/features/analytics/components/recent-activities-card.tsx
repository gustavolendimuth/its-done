"use client";

import { format } from "date-fns";
import { Activity, Calendar, Clock, FileText, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { DashboardStats } from "@/features/dashboard";

export interface RecentActivitiesCardProps {
  activities: DashboardStats["recentActivities"];
}

export function RecentActivitiesCard({
  activities,
}: RecentActivitiesCardProps) {
  const t = useTranslations("analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t("recentActivities")}
        </CardTitle>
        <CardDescription>{t("latestUpdates")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("noRecentActivities")}
            </p>
          ) : (
            activities.map((activity, index) => {
              // Determine styles based on activity type
              let gradientClasses =
                "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800";
              let iconBgColor = "bg-blue-500";

              if (activity.type === "invoice") {
                gradientClasses =
                  "from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800";
                iconBgColor = "bg-purple-500";
              } else if (activity.type === "client") {
                gradientClasses =
                  "from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800";
                iconBgColor = "bg-green-500";
              }

              return (
                <Card
                  key={index}
                  className={cn(
                    "overflow-hidden group relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                    "bg-gradient-to-br",
                    gradientClasses
                  )}
                >
                  {/* Accent bar */}
                  <div className={cn("h-2", iconBgColor)} />

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {/* Activity Icon */}
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold",
                          iconBgColor
                        )}
                      >
                        {activity.type === "work_hour" && (
                          <Clock className="h-6 w-6" />
                        )}
                        {activity.type === "invoice" && (
                          <FileText className="h-6 w-6" />
                        )}
                        {activity.type === "client" && (
                          <Users className="h-6 w-6" />
                        )}
                      </div>

                      {/* Activity Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold truncate">
                            {t(
                              activity.description.key,
                              Object.fromEntries(
                                Object.entries(activity.description.values).map(
                                  ([key, value]) => [key, value ?? ""]
                                )
                              )
                            )}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {t(activity.type)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(activity.date), "MMM dd, HH:mm")}</span>
                      {activity.client && (
                        <>
                          <Users className="h-4 w-4 ml-2" />
                          <span>{activity.client}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
