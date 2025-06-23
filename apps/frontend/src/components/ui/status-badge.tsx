import { useTranslations } from "next-intl";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("invoices");

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
        return t("paid");
      case "PENDING":
        return t("pending");
      case "CANCELED":
        return t("cancelled");
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
