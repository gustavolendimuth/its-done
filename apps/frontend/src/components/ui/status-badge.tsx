import { Badge } from "./badge";

interface StatusBadgeProps {
  status: "PENDING" | "PAID" | "CANCELED";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Paid";
      case "PENDING":
        return "Pending";
      case "CANCELED":
        return "Canceled";
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className={className}>
      {getStatusText(status)}
    </Badge>
  );
}
