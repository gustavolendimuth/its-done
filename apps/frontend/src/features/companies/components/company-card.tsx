"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Mail,
  Phone,
  Clock,
  User,
  Edit2,
  Eye,
  CheckCircle,
  Timer,
  Users,
  Link2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CompanyAddresses } from "./company-addresses";
import { CompanyShareMenu } from "./company-share-menu";

import { Badge } from "@/components/ui/badge";
import { BigCardStat, BigCardContactInfo } from "@/components/ui/big-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  useUpdateCompany,
  UpdateCompanyDto,
} from "@/features/companies/companies";
import { useCompanySpecificStats } from "@/features/companies/company-stats";
import { Company } from "@/features/companies/types";
import { cn, formatHoursToHHMM } from "@/lib/utils";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const t = useTranslations("clients");
  const { data: stats, isLoading } = useCompanySpecificStats(company.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const updateCompany = useUpdateCompany();

  const companyFormSchema = z.object({
    name: z.string().min(1, t("validationNameRequired")),
    email: z.string().email(t("validationInvalidEmail")),
    phone: z.string().min(1, t("validationPhoneRequired")),
    company: z.string().min(1, t("validationCompanyRequired")),
  });

  type CompanyFormData = z.infer<typeof companyFormSchema>;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      // Nullable columns: the API sends null, which a controlled <Input> rejects.
      name: company.name ?? "",
      email: company.email,
      phone: company.phone ?? "",
      company: company.company,
    },
  });

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/companies/${company.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit button clicked for company:", company.company);
    setIsEditModalOpen(true);
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await updateCompany.mutateAsync({
        id: company.id,
        data: data as UpdateCompanyDto,
      });
      setIsEditModalOpen(false);
      toast.success(t("clientUpdatedSuccessfully"));
    } catch (_error) {
      console.error("Failed to update company:", _error);
      toast.error(t("failedToUpdateClient"));
    }
  };

  // Prepare contact info
  const contactInfo: BigCardContactInfo[] = [
    { icon: User, value: company.name || t("noContactName") },
    { icon: Mail, value: company.email },
    ...(company.phone ? [{ icon: Phone, value: company.phone }] : []),
  ];

  // Prepare stats
  const cardStats: BigCardStat[] = [
    {
      icon: Clock,
      label: t("hours"),
      value: formatHoursToHHMM(stats?.totalHours ?? 0),
    },
    {
      icon: CheckCircle,
      label: t("paid"),
      value: `$${(stats?.paidValue ?? 0).toFixed(2)}`,
    },
    {
      icon: Timer,
      label: t("pending"),
      value: `$${(stats?.pendingValue ?? 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="group transition-all duration-200 hover:scale-[1.02] space-y-0">
      <Card
        className={cn(
          "overflow-hidden relative hover:shadow-lg rounded-b-none",
          "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
        )}
      >
        {company.hasActiveAdmin && (
          <Badge
            variant="success"
            className="absolute -top-2 -right-2 z-10 flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" /> {t("linkedBadge")}
          </Badge>
        )}

        {/* Accent bar */}
        <div className="h-2 bg-blue-500" />

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-blue-500">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold truncate">{company.company}</h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <info.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{info.value}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid gap-4 pt-4 border-t grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              cardStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {company.hasActiveAdmin && (
        <p className="text-xs text-muted-foreground px-1 pt-1">
          {t("linkedBadgeNote")}
        </p>
      )}

      {/* Action Buttons - Always Visible */}
      <div className="border border-t-0 rounded-t-none rounded-b-lg bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 group-hover:shadow-lg">
        <div className="p-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewClick}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t("view")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleEditClick}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {t("edit")}
            </Button>
            <CompanyShareMenu company={company} />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={t("editClient")}
        description={t("editClientFormSubtitle")}
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("company")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <PhoneInput {...field} placeholder="(11) 99999-9999" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CompanyAddresses companyId={company.id} />
            <Button type="submit" className="w-full">
              {t("saveChanges")}
            </Button>
          </form>
        </Form>
      </FormModal>
    </div>
  );
}
