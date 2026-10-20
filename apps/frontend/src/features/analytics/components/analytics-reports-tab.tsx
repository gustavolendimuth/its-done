"use client";

import type {
  HoursReport,
  InvoiceReport,
  ReportFilters,
  ReportType,
  SummaryReport,
} from "../types";
import type { Company } from "@/features/companies";

import { HoursReportSection } from "./hours-report-section";
import { InvoiceReportSection } from "./invoice-report-section";
import { ReportFiltersCard } from "./report-filters-card";
import { SummaryReportSection } from "./summary-report-section";

export interface AnalyticsReportsTabProps {
  filters: ReportFilters;
  reportType: ReportType;
  companies: Company[] | undefined;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  onReportTypeChange: (value: ReportType) => void;
  onQuickDateRange: (range: "thisMonth" | "lastMonth" | "last3Months") => void;
  hoursReport: HoursReport | undefined;
  companyHoursChartData: {
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
  companies,
  onFilterChange,
  onReportTypeChange,
  onQuickDateRange,
  hoursReport,
  companyHoursChartData,
  weeklyChartData,
  invoiceReport,
  summaryReport,
}: AnalyticsReportsTabProps) {
  return (
    <>
      <ReportFiltersCard
        filters={filters}
        reportType={reportType}
        companies={companies}
        onFilterChange={onFilterChange}
        onReportTypeChange={onReportTypeChange}
        onQuickDateRange={onQuickDateRange}
      />

      {reportType === "hours" && hoursReport && (
        <HoursReportSection
          hoursReport={hoursReport}
          companyHoursChartData={companyHoursChartData}
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
