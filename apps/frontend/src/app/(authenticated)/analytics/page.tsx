"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Download,
  BarChart3,
  FileText,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Calendar,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/services/dashboard";
import { useTimeEntries } from "@/services/time-entries";
import { useClients } from "@/services/clients";
import {
  useHoursReport,
  useInvoiceReport,
  useSummaryReport,
  type ReportFilters,
  type HoursReport,
  type InvoiceReport,
} from "@/services/reports";
import { toast } from "sonner";
import { AnalyticsBigStats } from "@/components/analytics/analytics-big-stats";
import {
  BigCard,
  BigCardStat,
  BigCardContactInfo,
} from "@/components/ui/big-card";
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
  const { data: timeEntries = [], isLoading: entriesLoading } =
    useTimeEntries(period);
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

  const monthlyChartData = useMemo(() => {
    return (
      hoursReport?.monthlyBreakdown?.map((item) => ({
        month: item.month,
        hours: item.totalHours,
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
        title="Analytics & Reports"
        description="Comprehensive insights into your work hours and productivity"
        icon={BarChart3}
        actions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: "outline" as const,
          },
          {
            label: "Export",
            icon: Download,
            onClick: handleExport,
            variant: "outline" as const,
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title="Advanced Analytics & Insights"
        description="Analyze your productivity patterns with detailed reports and interactive charts. Compare performance across different periods, identify top clients, track revenue trends, and make data-driven decisions. Filter by date ranges, clients, or projects to get specific insights."
        variant="info"
        className="mb-6"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="reports">Detailed Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Big Stats Display */}
          <AnalyticsBigStats className="mb-8" />

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Hours Trend</CardTitle>
                <CardDescription>
                  Hours worked over the last 4 weeks
                </CardDescription>
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
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Hours distribution by client</CardDescription>
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
          <div className="grid gap-6 md:grid-cols-3">
            {/* Recent Activities */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest work hours, invoices, and client updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No recent activities
                    </p>
                  ) : (
                    recentActivities.map((activity, index) => {
                      // Determine icon and color based on activity type
                      let icon = Clock;
                      let accentColor: "blue" | "green" | "purple" = "blue";

                      if (activity.type === "invoice") {
                        icon = FileText;
                        accentColor = "green";
                      } else if (activity.type === "client") {
                        icon = Users;
                        accentColor = "purple";
                      }

                      // Prepare contact info
                      const contactInfo: BigCardContactInfo[] = [
                        {
                          icon: Calendar,
                          value: format(
                            new Date(activity.date),
                            "MMM dd, HH:mm"
                          ),
                        },
                        ...(activity.client
                          ? [{ icon: Users, value: activity.client }]
                          : []),
                      ];

                      return (
                        <BigCard
                          key={index}
                          title={activity.description}
                          subtitle={activity.type
                            .replace("_", " ")
                            .toUpperCase()}
                          icon={icon}
                          contactInfo={contactInfo}
                          accentColor={accentColor}
                        />
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance KPIs</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg. Hours/Day
                    </span>
                    <span className="font-medium">
                      {(dashboardStats?.thisMonthHours &&
                        (
                          dashboardStats.thisMonthHours / new Date().getDate()
                        ).toFixed(1)) ||
                        "0"}
                      h
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">
                      {formatHoursToHHMM(dashboardStats?.thisMonthHours || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">
                      {formatHoursToHHMM(dashboardStats?.lastMonthHours || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Pending Invoices
                    </span>
                    <span className="font-medium">
                      {dashboardStats?.pendingInvoices || 0}
                    </span>
                  </div>
                </div>

                {dashboardStats?.topClients &&
                  dashboardStats.topClients.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Top Client</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate pr-2">
                            {dashboardStats.topClients[0].name}
                          </span>
                          <span className="font-medium">
                            {formatHoursToHHMM(
                              dashboardStats.topClients[0].totalHours
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Invoices
                          </span>
                          <span className="font-medium">
                            {dashboardStats.topClients[0].totalInvoices}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
                Report Filters
              </CardTitle>
              <CardDescription>
                Filter data to generate custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
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
                    placeholder="Pick start date"
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePickerComponent
                    value={filters.endDate ? new Date(filters.endDate) : null}
                    onChange={(date) =>
                      handleFilterChange(
                        "endDate",
                        date ? format(date, "yyyy-MM-dd") : ""
                      )
                    }
                    placeholder="Pick end date"
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={filters.clientId || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("clientId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
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
                      <SelectItem value="hours">Hours Report</SelectItem>
                      <SelectItem value="invoices">Invoice Report</SelectItem>
                      <SelectItem value="summary">Summary Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quick Ranges</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("thisMonth")}
                    >
                      This Month
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("lastMonth")}
                    >
                      Last Month
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickDateRange("last3Months")}
                    >
                      Last 3M
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
                    <CardTitle>Client Hours Distribution</CardTitle>
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
                    <CardTitle>Weekly Hours Trend</CardTitle>
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
                  <CardTitle>Detailed Hours Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Avg Hours/Day</TableHead>
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
                    <CardTitle className="text-sm">Total Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoiceReport.totalInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pending Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoiceReport.pendingInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Paid Invoices</CardTitle>
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
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Total Invoices</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Paid</TableHead>
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
                    <CardTitle className="text-sm">Total Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatHoursToHHMM(summaryReport.hours.totalHours)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryReport.invoices.totalInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pending Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryReport.invoices.pendingInvoices}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Paid Invoices</CardTitle>
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
                  <CardTitle>Period Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Summary report for the period from{" "}
                    {filters.startDate &&
                      format(new Date(filters.startDate), "MMM dd, yyyy")}{" "}
                    to{" "}
                    {filters.endDate &&
                      format(new Date(filters.endDate), "MMM dd, yyyy")}
                    . This includes data from{" "}
                    {formatHoursToHHMM(summaryReport.hours.totalHours)} worked
                    across {summaryReport.invoices.totalInvoices} total
                    invoices.
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
