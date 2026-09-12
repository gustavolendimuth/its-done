"use client";

import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { InfoCard } from "@/components/ui/info-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "@/features/clients";
import { useDashboardStats } from "@/features/dashboard";
import { useTimeEntries } from "@/features/time-tracking";
import { useHoursReport, useInvoiceReport, useSummaryReport } from "../reports.service";

import { AnalyticsOverviewTab } from "./analytics-overview-tab";
import { AnalyticsReportsTab } from "./analytics-reports-tab";
import type { ReportFilters, ReportType } from "../types";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

export function AnalyticsView() {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  const [reportType, setReportType] = useState<ReportType>("hours");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    clientId: "all",
  });

  // Dashboard stats for overview
  const [period] = useState({
    from: startOfMonth(new Date()).toISOString(),
    to: endOfMonth(new Date()).toISOString(),
  });

  const { data: dashboardStats, isLoading: statsLoading } =
    useDashboardStats(period);
  const { isLoading: entriesLoading } = useTimeEntries(period);
  const { data: clients } = useClients();

  // Fetch reports based on type and filters
  const {
    data: hoursReport,
    isLoading: hoursLoading,
    refetch: refetchHours,
  } = useHoursReport(
    reportType === "hours" || reportType === "summary" ? filters : undefined
  );

  const {
    data: invoiceReport,
    isLoading: invoiceLoading,
    refetch: refetchInvoices,
  } = useInvoiceReport(
    reportType === "invoices" || reportType === "summary" ? filters : undefined
  );

  const {
    data: summaryReport,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useSummaryReport(
    reportType === "summary"
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : undefined
  );

  const isLoading =
    hoursLoading ||
    invoiceLoading ||
    summaryLoading ||
    statsLoading ||
    entriesLoading;

  // Process data for dashboard insights
  const topClientsData =
    dashboardStats?.topClients?.map((client, index) => ({
      name: client.name,
      hours: client.totalHours,
      color: COLORS[index % COLORS.length],
    })) || [];

  const weeklyData =
    dashboardStats?.weeklyHours?.map((item) => ({
      week: item.week,
      hours: item.hours,
    })) || [];

  const recentActivities = dashboardStats?.recentActivities?.slice(0, 8) || [];

  // Process data for detailed reports
  const clientHoursChartData = useMemo(() => {
    return (
      hoursReport?.clientBreakdown?.map((client, index) => ({
        name: client.clientName,
        hours: client.totalHours,
        percentage: client.percentage,
        color: COLORS[index % COLORS.length],
      })) || []
    );
  }, [hoursReport]);

  const weeklyChartData = useMemo(() => {
    return (
      hoursReport?.weeklyBreakdown?.map((item) => ({
        week: item.week,
        hours: item.totalHours,
      })) || []
    );
  }, [hoursReport]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const handleQuickDateRange = (
    range: "thisMonth" | "lastMonth" | "last3Months"
  ) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (range) {
      case "thisMonth":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last3Months":
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
    }

    setFilters((prev) => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }));
  };

  const handleRefresh = () => {
    switch (reportType) {
      case "hours":
        refetchHours();
        break;
      case "invoices":
        refetchInvoices();
        break;
      case "summary":
        refetchSummary();
        break;
    }
    toast.success("Report refreshed");
  };

  const handleExport = () => {
    toast.success("Export feature coming soon!");
  };

  if (isLoading) {
    return <LoadingSkeleton type="analytics-page" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={BarChart3}
        actions={[
          {
            label: tCommon("refresh"),
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: "outline" as const,
          },
          {
            label: t("export"),
            icon: Download,
            onClick: handleExport,
            variant: "outline" as const,
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title={t("infoTitle")}
        description={t("description")}
        variant="info"
        className="mb-6"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t("performanceOverview")}</TabsTrigger>
          <TabsTrigger value="reports">{t("detailedReports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverviewTab
            topClientsData={topClientsData}
            weeklyData={weeklyData}
            recentActivities={recentActivities}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AnalyticsReportsTab
            filters={filters}
            reportType={reportType}
            clients={clients}
            onFilterChange={handleFilterChange}
            onReportTypeChange={setReportType}
            onQuickDateRange={handleQuickDateRange}
            hoursReport={hoursReport}
            clientHoursChartData={clientHoursChartData}
            weeklyChartData={weeklyChartData}
            invoiceReport={invoiceReport}
            summaryReport={summaryReport}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
