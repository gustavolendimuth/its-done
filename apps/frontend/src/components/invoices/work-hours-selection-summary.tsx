"use client";

import { Calculator, Clock, FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatHoursToHHMM } from "@/lib/utils";
import { WorkHoursSelectionSummaryProps } from "@/types/invoices";

export function WorkHoursSelectionSummary({
  totalHours,
  hourlyRate,
  totalAmount,
  className,
}: WorkHoursSelectionSummaryProps) {
  // if (totalAmount <= 0 && totalHours <= 0) return null;

  return (
    <Card className={className ? className : "bg-primary/5"}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Total Hours</p>
              <p className="text-lg font-bold">{formatHoursToHHMM(totalHours)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calculator className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Hourly Rate</p>
              <p className="text-lg font-bold">${hourlyRate}/hr</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
