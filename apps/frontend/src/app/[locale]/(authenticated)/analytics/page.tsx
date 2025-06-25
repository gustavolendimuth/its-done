"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Download,
  BarChart3,
  FileText,
  Clock,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
} from "lucide-react";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { useDashboardStats } from "@/services/dashboard";
import { useTimeEntries } from "@/services/time-entries";
import { useClients } from "@/services/clients";
import {
  useHoursReport,
  useInvoiceReport,
  useSummaryReport,
  type ReportFilters,
} from "@/services/reports";
import { toast } from "sonner";
import { AnalyticsBigStats } from "@/components/analytics/analytics-big-stats";

import { InfoCard } from "@/components/ui/info-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  const [reportType, setReportType] = useState<
    "hours" | "invoices" | "summary"
  >("hours");
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
          {/* Big Stats Display */}
          <AnalyticsBigStats className="mb-8" />

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t("weeklyHoursTrend")}</CardTitle>
                <CardDescription>{t("hoursWorkedLast4Weeks")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Clients Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t("topClients")}</CardTitle>
                <CardDescription>
                  {t("hoursDistributionByClient")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topClientsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, hours }) =>
                          `${name}: ${formatHoursToHHMM(hours)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="hours"
                        stroke="hsl(var(--foreground))"
                        strokeWidth={1}
                      >
                        {topClientsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid gap-6">
            {/* Recent Activities */}
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
                  {recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {t("noRecentActivities")}
                    </p>
                  ) : (
                    recentActivities.map((activity, index) => {
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
                                      activity.description.values
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
                              <span>
                                {format(
                                  new Date(activity.date),
                                  "MMM dd, HH:mm"
                                )}
                              </span>
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
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t("reportFilters")}
              </CardTitle>
              <CardDescription>{t("filterDataCustomReports")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("startDate")}</Label>
                  <DatePickerComponent
                    value={
                      filters.startDate ? new Date(filters.startDate) : null
                    }
                    onChange={(date) =>
                      handleFilterChange(
                        "startDate",
                        date ? format(date, "yyyy-MM-dd") : ""
                      )
                    }
                    placeholder={t("pickStartDate")}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("endDate")}</Label>
                  <DatePickerComponent
                    value={filters.endDate ? new Date(filters.endDate) : null}
                    onChange={(date) =>
                      handleFilterChange(
                        "endDate",
                        date ? format(date, "yyyy-MM-dd") : ""
                      )
                    }
                    placeholder={t("pickEndDate")}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">{t("client")}</Label>
                  <Select
                    value={filters.clientId || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("clientId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectClient")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allClients")}</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportType">{t("reportType")}</Label>
                  <Select
                    value={reportType}
                    onValueChange={(value: "hours" | "invoices" | "summary") =>
                      setReportType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">{t("hoursReport")}</SelectItem>
                      <SelectItem value="invoices">
                        {t("invoiceReport")}
                      </SelectItem>
                      <SelectItem value="summary">
                        {t("summaryReport")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("quickRanges")}</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("thisMonth")}
                    >
                      {t("thisMonthShort")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("lastMonth")}
                    >
                      {t("lastMonthShort")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("last3Months")}
                    >
                      {t("last3Months")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          {reportType === "hours" && hoursReport && (
            <div className="grid gap-6">
              {/* Hours Report Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("clientHoursDistribution")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientHoursChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, hours, percentage }) =>
                              `${name}: ${formatHoursToHHMM(hours)} (${percentage}%)`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="hours"
                          >
                            {clientHoursChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("weeklyHoursTrend")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hours Report Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("detailedHoursBreakdown")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("client")}</TableHead>
                        <TableHead>{t("totalHours")}</TableHead>
                        <TableHead>{t("percentage")}</TableHead>
                        <TableHead>{t("avgHoursDay")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hoursReport.clientBreakdown?.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">
                            {client.clientName}
                          </TableCell>
                          <TableCell>
                            {formatHoursToHHMM(client.totalHours)}
                          </TableCell>
                          <TableCell>{client.percentage.toFixed(1)}%</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === "invoices" && invoiceReport && (
            <div className="grid gap-6">
              {/* Invoice Report Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("totalInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoiceReport.totalInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("pendingInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoiceReport.pendingInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("paidInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoiceReport.paidInvoices}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Report Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("invoiceDetails")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("client")}</TableHead>
                        <TableHead>{t("totalInvoices")}</TableHead>
                        <TableHead>{t("pending")}</TableHead>
                        <TableHead>{t("paid")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceReport.clientBreakdown?.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">
                            {client.clientName}
                          </TableCell>
                          <TableCell>{client.totalInvoices}</TableCell>
                          <TableCell>{client.pendingInvoices}</TableCell>
                          <TableCell>{client.paidInvoices}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === "summary" && summaryReport && (
            <div className="grid gap-6">
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t("totalHours")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatHoursToHHMM(summaryReport.hours.totalHours)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("totalInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryReport.invoices.totalInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("pendingInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryReport.invoices.pendingInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("paidInvoices")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryReport.invoices.paidInvoices}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Description */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("periodSummary")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("summaryReportPeriod", {
                      startDate: filters.startDate
                        ? format(new Date(filters.startDate), "MMM dd, yyyy")
                        : "",
                      endDate: filters.endDate
                        ? format(new Date(filters.endDate), "MMM dd, yyyy")
                        : "",
                      hours: formatHoursToHHMM(summaryReport.hours.totalHours),
                      invoices: summaryReport.invoices.totalInvoices,
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
