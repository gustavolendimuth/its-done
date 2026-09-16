import type { OverviewStats } from "./overview";

import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface OverviewPerformanceCardsProps {
  stats: OverviewStats;
}

export function OverviewPerformanceCards({
  stats,
}: OverviewPerformanceCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {stats.monthlyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-2xl font-bold ${
                stats.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.monthlyGrowth >= 0 ? "+" : ""}
              {stats.monthlyGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            vs. previous month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-2xl font-bold">
              ${stats.pendingAmount.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pendingInvoices} pending invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-green-600">
                {stats.paidInvoices}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-yellow-600">
                {stats.pendingInvoices}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Canceled</span>
              <span className="font-medium text-red-600">
                {stats.canceledInvoices}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
