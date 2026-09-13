"use client";


import { HoursReportSection } from "./hours-report-section";
import { InvoiceReportSection } from "./invoice-report-section";
import { ReportFiltersCard } from "./report-filters-card";
import { SummaryReportSection } from "./summary-report-section";

import type {
  HoursReport,
  InvoiceReport,
  ReportFilters,
  ReportType,
  SummaryReport,
} from "../types";
import type { Client } from "@/features/clients";

export interface AnalyticsReportsTabProps {
  filters: ReportFilters;
  reportType: ReportType;
  clients: Client[] | undefined;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  onReportTypeChange: (value: ReportType) => void;
  onQuickDateRange: (
    range: "thisMonth" | "lastMonth" | "last3Months"
  ) => void;
  hoursReport: HoursReport | undefined;
  clientHoursChartData: {
    name: string;
    hours: number;
    percentage: number;
    color: string;
  }[];
  weeklyChartData: { week: string; hours: number }[];
  invoiceReport: InvoiceReport | undefined;
  summaryReport: SummaryReport | undefined;
}

export function AnalyticsReportsTab({
  filters,
  reportType,
  clients,
  onFilterChange,
  onReportTypeChange,
  onQuickDateRange,
  hoursReport,
  clientHoursChartData,
  weeklyChartData,
  invoiceReport,
  summaryReport,
}: AnalyticsReportsTabProps) {
  return (
    <>
      <ReportFiltersCard
        filters={filters}
        reportType={reportType}
        clients={clients}
        onFilterChange={onFilterChange}
        onReportTypeChange={onReportTypeChange}
        onQuickDateRange={onQuickDateRange}
      />

      {reportType === "hours" && hoursReport && (
        <HoursReportSection
          hoursReport={hoursReport}
          clientHoursChartData={clientHoursChartData}
          weeklyChartData={weeklyChartData}
        />
      )}

      {reportType === "invoices" && invoiceReport && (
        <InvoiceReportSection invoiceReport={invoiceReport} />
      )}

      {reportType === "summary" && summaryReport && (
        <SummaryReportSection summaryReport={summaryReport} filters={filters} />
      )}
    </>
  );
}
