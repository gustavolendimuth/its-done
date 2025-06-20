import React from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  id: string;
  number?: string;
  clientName?: string;
  clientEmail?: string;
  amount: number;
  status: "PAID" | "PENDING" | "CANCELED" | "paid" | "pending" | "canceled";
  createdAt: string | Date;
  fileUrl?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (id: string) => void;
  className?: string;
}

const getStatusColor = (status: InvoiceCardProps["status"]) => {
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
  const accentColor = getStatusColor(status);
  const displayClient = clientName || clientEmail || "No client";
  const invoiceNumber = number || id.slice(-8);

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice? This action cannot be undone."
    );
    if (confirmed) {
      onDelete(id);
    }
  };

  const handleDownloadOrUpload = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      onUpload(id);
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
              <h3 className="text-xl font-bold truncate">#{invoiceNumber}</h3>
              <StatusBadge
                status={status.toUpperCase() as "PENDING" | "PAID" | "CANCELED"}
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
                Amount
              </p>
              <p className="text-sm font-bold">${amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Status
              </p>
              <p className="text-sm font-bold">{status.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Created
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
                Download
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onEdit(id)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
