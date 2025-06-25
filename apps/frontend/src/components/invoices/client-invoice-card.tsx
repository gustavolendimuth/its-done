import React from "react";
import { FileText, Clock, Calendar, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { format } from "date-fns";
import { Invoice } from "@/services/invoices";

export interface ClientInvoiceCardProps {
  invoice: Invoice;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "PAID":
      return "green";
    case "CANCELED":
      return "red";
    case "PENDING":
      return "yellow";
    default:
      return "blue";
  }
};

const accentColorStyles = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
};

export function ClientInvoiceCard({
  invoice,
  className,
}: ClientInvoiceCardProps) {
  const accentColor = getStatusColor(invoice.status);
  const invoiceNumber = invoice.number || `INV-${invoice.id.slice(-8)}`;

  // Calculate total hours for this invoice
  const totalHours =
    invoice.invoiceWorkHours?.reduce(
      (sum, iwh) => sum + (iwh.workHour?.hours || 0),
      0
    ) || 0;

  // Get work period (first and last work dates)
  const workDates = invoice.invoiceWorkHours
    ?.map((iwh) => iwh.workHour?.date)
    .filter(Boolean)
    .sort();

  const workPeriod =
    workDates && workDates.length > 0
      ? workDates.length === 1
        ? format(new Date(workDates[0]), "MMM dd, yyyy")
        : `${format(new Date(workDates[0]), "MMM dd")} - ${format(new Date(workDates[workDates.length - 1]), "MMM dd, yyyy")}`
      : "No work period";

  const handleDownload = () => {
    if (invoice.fileUrl) {
      // Create a temporary link to download the file
      const link = document.createElement("a");

      link.href = invoice.fileUrl;
      link.download = `${invoiceNumber}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = () => {
    if (invoice.fileUrl) {
      window.open(invoice.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden group relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        className
      )}
    >
      {/* Accent bar */}
      <div className={cn("h-2", accentColorStyles[accentColor])} />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Invoice Icon */}
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold",
              accentColorStyles[accentColor]
            )}
          >
            <FileText className="h-6 w-6" />
          </div>

          {/* Invoice Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold truncate">{invoiceNumber}</h3>
              <StatusBadge
                status={
                  invoice.status.toUpperCase() as
                    | "PENDING"
                    | "PAID"
                    | "CANCELED"
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${invoice.amount.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Work Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 pb-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Hours Worked
              </p>
              <p className="text-sm font-bold">
                {formatHoursToHHMM(totalHours)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Work Period
              </p>
              <p className="text-sm font-bold">{workPeriod}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {invoice.description && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Description
            </p>
            <p className="text-sm text-foreground">{invoice.description}</p>
          </div>
        )}

        {/* Due Date */}
        {invoice.dueDate && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Due Date
                </p>
                <p className="text-sm font-medium">
                  {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {invoice.fileUrl ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleView}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleDownload}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center py-2">
              <p className="text-xs text-muted-foreground">No file available</p>
            </div>
          )}
        </div>

        {/* Work Hours Details */}
        {invoice.invoiceWorkHours && invoice.invoiceWorkHours.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Work Sessions ({invoice.invoiceWorkHours.length})
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {invoice.invoiceWorkHours.slice(0, 3).map((iwh) => (
                <div
                  key={iwh.id}
                  className="flex justify-between items-start text-xs bg-muted/30 p-2 rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {iwh.workHour?.description || "No description"}
                    </p>
                    <p className="text-muted-foreground">
                      {iwh.workHour?.date &&
                        format(new Date(iwh.workHour.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="ml-2 text-right">
                    <p className="font-bold">
                      {formatHoursToHHMM(iwh.workHour?.hours || 0)}
                    </p>
                  </div>
                </div>
              ))}
              {invoice.invoiceWorkHours.length > 3 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{invoice.invoiceWorkHours.length - 3} more sessions
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
