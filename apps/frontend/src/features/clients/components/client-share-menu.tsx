"use client";

import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Client } from "@/types/client";

interface ClientShareMenuProps {
  client: Client;
}

export function ClientShareMenu({ client }: ClientShareMenuProps) {
  const t = useTranslations("clients");

  const getClientDashboardUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";

    return `${baseUrl}/client-dashboard/${client.id}`;
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCopyLink = async () => {
    try {
      const url = getClientDashboardUrl();

      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopiedToClipboard"));
    } catch (_error) {
      toast.error(t("failedToCopyLink"));
    }
  };

  const handleShareWhatsApp = () => {
    const url = getClientDashboardUrl();
    const message = t("whatsappShareMessage", { url });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const url = getClientDashboardUrl();
    const subject = t("emailShareSubject", { company: client.company });
    const body = t("emailShareBody", { url });
    const emailUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(emailUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleShareClick}
        >
          <Share2 className="h-4 w-4 mr-1" />
          {t("share")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("shareClientDashboard")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          <span>{t("copyLink")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>{t("shareViaWhatsApp")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareEmail}>
          <Mail className="mr-2 h-4 w-4" />
          <span>{t("sendViaEmail")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
