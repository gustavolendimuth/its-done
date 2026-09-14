"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatHoursToHHMM } from "@/lib/utils";

import type { ReportFilters, SummaryReport } from "../types";

export interface SummaryReportSectionProps {
  summaryReport: SummaryReport;
  filters: ReportFilters;
}

export function SummaryReportSection({
  summaryReport,
  filters,
}: SummaryReportSectionProps) {
  const t = useTranslations("analytics");

  return (
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
            <CardTitle className="text-sm">{t("totalInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryReport.invoices.totalInvoices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("pendingInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryReport.invoices.pendingInvoices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("paidInvoices")}</CardTitle>
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
  );
}
