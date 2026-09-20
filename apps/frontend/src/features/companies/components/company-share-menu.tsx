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
import { Company } from "@/features/companies/types";

interface CompanyShareMenuProps {
  company: Company;
}

export function CompanyShareMenu({ company }: CompanyShareMenuProps) {
  const t = useTranslations("clients");

  const buildUrl = (path: string) => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";

    return `${baseUrl}${path}`;
  };

  const dashboardUrl = () => buildUrl(`/client-dashboard/${company.id}`);
  const activationUrl = () =>
    buildUrl(
      `/company-admin/activate/request?companyId=${encodeURIComponent(company.id)}`
    );

  // Only offered when the API says the company has no admin. `undefined`
  // (older payloads) hides it rather than showing it to already-active companies.
  const canInviteToActivate = company.hasActiveAdmin === false;

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopiedToClipboard"));
    } catch (_error) {
      toast.error(t("failedToCopyLink"));
    }
  };

  const openWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const openMailClient = (subject: string, body: string) => {
    window.open(
      `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
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
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("shareClientDashboard")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copy(dashboardUrl())}>
          <Copy className="mr-2 h-4 w-4" />
          <span>{t("copyLink")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openWhatsApp(t("whatsappShareMessage", { url: dashboardUrl() }))
          }
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>{t("shareViaWhatsApp")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openMailClient(
              t("emailShareSubject", { company: company.company }),
              t("emailShareBody", { url: dashboardUrl() })
            )
          }
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>{t("sendViaEmail")}</span>
        </DropdownMenuItem>

        {canInviteToActivate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("shareActivationLink")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => copy(activationUrl())}>
              <Copy className="mr-2 h-4 w-4" />
              <span>{t("copyActivationLink")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openWhatsApp(
                  t("activationWhatsappMessage", { url: activationUrl() })
                )
              }
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>{t("shareActivationViaWhatsApp")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openMailClient(
                  t("activationEmailSubject", { company: company.company }),
                  t("activationEmailBody", { url: activationUrl() })
                )
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>{t("sendActivationViaEmail")}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
