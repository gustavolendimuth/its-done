"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CompanyAddresses } from "./company-addresses";

import { Button } from "@/components/ui/button";
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
import { useUpdateCompany } from "@/features/companies/companies";
import {
  createCompanyEditSchema,
  toCompanyEditFormValues,
} from "@/features/companies/company-edit-form";
import { Company, UpdateCompanyDto } from "@/features/companies/types";

// Visual "required" marker, drawn by CSS so it stays out of the label text.
const REQUIRED_LABEL = "after:ml-0.5 after:text-destructive after:content-['*']";

interface EditCompanyModalProps {
  company: Company;
  trigger?: React.ReactNode;
}

export function EditCompanyModal({ company, trigger }: EditCompanyModalProps) {
  const [open, setOpen] = useState(false);
  const updateCompany = useUpdateCompany();
  const t = useTranslations("clients");

  const companyFormSchema = createCompanyEditSchema(t).extend({
    hourlyRate: z
      .number()
      .min(0, { message: "Hourly rate must be 0 or greater" })
      .optional()
      .nullable(),
  });

  type CompanyFormData = z.infer<typeof companyFormSchema>;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      ...toCompanyEditFormValues(company),
      hourlyRate: company.hourlyRate ?? null,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const formattedData = {
        ...data,
        hourlyRate: data.hourlyRate === null ? undefined : data.hourlyRate,
      };
      await updateCompany.mutateAsync({
        id: company.id,
        data: formattedData as UpdateCompanyDto,
      });
      setOpen(false);
      toast.success(t("clientUpdatedSuccessfully"));
    } catch (error) {
      console.error("Failed to update company:", error);
      toast.error(t("failedToUpdateClient"));
    }
  };

  const handleTriggerClick = () => setOpen(true);

  return (
    <>
      {trigger ? (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button variant="outline" onClick={handleTriggerClick}>
          {t("editClient")}
        </Button>
      )}

      <FormModal
        open={open}
        onOpenChange={setOpen}
        title={t("editClient")}
        description={t("editClientFormSubtitle")}
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={REQUIRED_LABEL}>{t("company")}</FormLabel>
                  <FormControl>
                    <Input {...field} aria-required="true" />
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
                  <FormLabel className={REQUIRED_LABEL}>{t("email")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" aria-required="true" />
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
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("hourlyRate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
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
    </>
  );
}
