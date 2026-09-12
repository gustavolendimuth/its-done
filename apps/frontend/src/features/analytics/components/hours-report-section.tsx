"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatHoursToHHMM } from "@/lib/utils";

import type { HoursReport } from "../types";

export interface HoursReportSectionProps {
  hoursReport: HoursReport;
  clientHoursChartData: {
    name: string;
    hours: number;
    percentage: number;
    color: string;
  }[];
  weeklyChartData: { week: string; hours: number }[];
}

export function HoursReportSection({
  hoursReport,
  clientHoursChartData,
  weeklyChartData,
}: HoursReportSectionProps) {
  const t = useTranslations("analytics");

  return (
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
                  <TableCell>{formatHoursToHHMM(client.totalHours)}</TableCell>
                  <TableCell>{client.percentage.toFixed(1)}%</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
