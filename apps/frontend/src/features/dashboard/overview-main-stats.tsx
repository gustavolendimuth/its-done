import { CheckCircle, Clock, DollarSign, FileText } from "lucide-react";

import { StatsCard } from "@/components/ui/stats-card";
import { formatHoursToHHMM } from "@/lib/utils";

import type { OverviewStats } from "./overview";

export interface OverviewMainStatsProps {
  stats: OverviewStats;
}

export function OverviewMainStats({ stats }: OverviewMainStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Invoices"
        value={stats.totalInvoices}
        description="All time invoices"
        icon={FileText}
        variant="blue"
      />

      <StatsCard
        title="Total Hours"
        value={formatHoursToHHMM(stats.totalHours)}
        description="Hours worked"
        icon={Clock}
        variant="green"
      />

      <StatsCard
        title="Total Amount"
        value={`$${stats.totalAmount.toFixed(2)}`}
        description={`Avg: $${stats.averageInvoiceValue.toFixed(2)}`}
        icon={DollarSign}
        variant="purple"
      />

      <StatsCard
        title="Paid Amount"
        value={`$${stats.paidAmount.toFixed(2)}`}
        description={`${stats.paidInvoices} invoices paid`}
        icon={CheckCircle}
        variant="orange"
      />
    </div>
  );
}
