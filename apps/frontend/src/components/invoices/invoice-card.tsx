import { format } from "date-fns";
import {
  LucideIcon,
  FileText,
  DollarSign,
  CheckCircle,
  Calendar,
  Download,
  Upload,
  Edit,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useDownloadInvoice } from "@/services/invoices";

export interface InvoiceCardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export interface InvoiceCardProps {
  id?: string;
  number?: string;
  clientName?: string;
  clientEmail?: string;
  amount: number;
  status?: "PAID" | "PENDING" | "CANCELED" | "paid" | "pending" | "canceled";
  createdAt: string | Date;
  fileUrl?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (id: string) => void;
  className?: string;
}

const getStatusColor = (status: InvoiceCardProps["status"]) => {
  if (!status) return "blue"; // Default color if status is undefined/null

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
  purple: "bg-purple-500",
};

export function InvoiceCard({
  id,
  number,
  clientName,
  clientEmail,
  amount,
  status,
  createdAt,
  fileUrl,
  onEdit,
  onDelete,
  onUpload,
  className,
}: InvoiceCardProps) {
  const t = useTranslations("invoices");
  const downloadInvoiceMutation = useDownloadInvoice();

  const accentColor = getStatusColor(status);
  const displayClient = clientName || clientEmail || t("noClient");
  const invoiceNumber = number || (id ? id.slice(-8) : "N/A");

  const handleDelete = () => {
    if (!id) return;
    const confirmed = window.confirm(t("confirmDeleteMessage"));

    if (confirmed) {
      onDelete(id);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;

    try {
      const blob = await downloadInvoiceMutation.mutateAsync(fileUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDownloadOrUpload = () => {
    if (fileUrl) {
      handleDownload();
    } else if (onUpload && id) {
      onUpload(id);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden group relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
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
              <h3 className="text-xl font-bold truncate">#{invoiceNumber}</h3>
              <StatusBadge
                status={
                  (status?.toUpperCase() || "PENDING") as
                    | "PENDING"
                    | "PAID"
                    | "CANCELED"
                }
              />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {displayClient}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 pb-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("amount")}
              </p>
              <p className="text-sm font-bold">${amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("status")}
              </p>
              <p className="text-sm font-bold">
                {status?.toUpperCase() || "PENDING"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("created")}
              </p>
              <p className="text-sm font-bold">
                {format(new Date(createdAt), "MMM dd")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleDownloadOrUpload}
          >
            {fileUrl ? (
              <>
                <Download className="w-3 h-3 mr-1" />
                {t("download")}
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                {t("upload")}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => id && onEdit(id)}
          >
            <Edit className="w-3 h-3 mr-1" />
            {t("edit")}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {t("delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
