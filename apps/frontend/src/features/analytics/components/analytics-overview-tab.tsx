"use client";

import { AnalyticsBigStats } from "./analytics-big-stats";
import { RecentActivitiesCard } from "./recent-activities-card";
import { TopClientsChart } from "./top-clients-chart";
import { WeeklyHoursChart } from "./weekly-hours-chart";

import type { DashboardStats } from "@/features/dashboard";

export interface AnalyticsOverviewTabProps {
  topClientsData: { name: string; hours: number; color: string }[];
  weeklyData: { week: string; hours: number }[];
  recentActivities: DashboardStats["recentActivities"];
}

export function AnalyticsOverviewTab({
  topClientsData,
  weeklyData,
  recentActivities,
}: AnalyticsOverviewTabProps) {
  return (
    <>
      {/* Big Stats Display */}
      <AnalyticsBigStats className="mb-8" />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <WeeklyHoursChart data={weeklyData} />
        <TopClientsChart data={topClientsData} />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6">
        <RecentActivitiesCard activities={recentActivities} />
      </div>
    </>
  );
}
