"use client";

import { format } from "date-fns";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReportFilters, ReportType } from "../types";
import type { Client } from "@/features/clients";

export interface ReportFiltersCardProps {
  filters: ReportFilters;
  reportType: ReportType;
  clients: Client[] | undefined;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  onReportTypeChange: (value: ReportType) => void;
  onQuickDateRange: (
    range: "thisMonth" | "lastMonth" | "last3Months"
  ) => void;
}

export function ReportFiltersCard({
  filters,
  reportType,
  clients,
  onFilterChange,
  onReportTypeChange,
  onQuickDateRange,
}: ReportFiltersCardProps) {
  const t = useTranslations("analytics");

  return (
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
              value={filters.startDate ? new Date(filters.startDate) : null}
              onChange={(date) =>
                onFilterChange(
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
                onFilterChange(
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
              onValueChange={(value) => onFilterChange("clientId", value)}
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
              onValueChange={(value: ReportType) => onReportTypeChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">{t("hoursReport")}</SelectItem>
                <SelectItem value="invoices">{t("invoiceReport")}</SelectItem>
                <SelectItem value="summary">{t("summaryReport")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("quickRanges")}</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickDateRange("thisMonth")}
              >
                {t("thisMonthShort")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickDateRange("lastMonth")}
              >
                {t("lastMonthShort")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickDateRange("last3Months")}
              >
                {t("last3Months")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
