"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AddressCombobox } from "@/components/ui/address-combobox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useCompanyAddresses } from "@/features/companies/addresses";
import { useCreateCompany } from "@/features/companies/companies";
import { Company } from "@/features/companies/types";

interface CompanyFormData {
  name?: string;
  email: string;
  phone?: string;
  company: string;
  hourlyRate?: string;
}

interface CompanyFormProps {
  onSuccess?: () => void;
}

export function CompanyForm({ onSuccess }: CompanyFormProps) {
  const t = useTranslations("clients");
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    hourlyRate: "",
  });
  const [createdCompany, setCreatedCompany] = useState<Company | null>(null);
  const { data: addresses } = useCompanyAddresses(createdCompany?.id || "");
  const createCompanyMutation = useCreateCompany();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting company form with data:", formData);

    // Basic validation
    if (!formData.company.trim()) {
      console.error("Company is required");

      return;
    }

    if (!formData.email.trim()) {
      console.error("Email is required");

      return;
    }

    // Strip empty fields - company data only
    const cleanCompanyData = {
      company: formData.company.trim(),
      email: formData.email.trim(),
      ...(formData.name?.trim() && { name: formData.name.trim() }),
      ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
      ...(formData.hourlyRate?.trim() && {
        hourlyRate: Number(formData.hourlyRate),
      }),
    };

    console.log("Clean company data to be sent:", cleanCompanyData);

    try {
      console.log("Submitting company:", cleanCompanyData);
      const createdCompany =
        await createCompanyMutation.mutateAsync(cleanCompanyData);

      console.log("Company created successfully:", createdCompany);

      if (createdCompany) {
        console.log("Setting created company:", createdCompany);
        setCreatedCompany(createdCompany);

        // Clear form
        setFormData({
          company: "",
          email: "",
          name: "",
          phone: "",
          hourlyRate: "",
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressAdded = () => {
    console.log(
      "Address added successfully, invalidating queries for company:",
      createdCompany?.id,
    );
    queryClient.invalidateQueries({
      queryKey: ["clients", createdCompany?.id, "addresses"],
    });
  };

  const handleFinish = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      hourlyRate: "",
    });
    setCreatedCompany(null);
    onSuccess?.();
  };

  // If the company was created, show the addresses section
  if (createdCompany) {
    console.log("Created company:", createdCompany);

    return (
      <div className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <div className="ml-2">
            <p className="font-medium text-foreground">{t("saveSuccess")}</p>
            <p className="text-sm text-muted-foreground">
              {t("nowYouCanAddAddresses", { company: createdCompany.company })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("id")}: {createdCompany.id}
            </p>
          </div>
        </Alert>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {t("addressesOptional")}
          </Label>
          {createdCompany.id ? (
            <AddressCombobox
              addresses={addresses || []}
              companyId={createdCompany.id}
              showAddButton={true}
              onAddressAdded={handleAddressAdded}
            />
          ) : (
            <div className="text-sm text-red-500">
              {t("errorClientIdNotAvailable")}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleFinish} className="flex-1">
            {t("finish")}
          </Button>
          <Button variant="outline" onClick={() => setCreatedCompany(null)}>
            {t("addAnotherClient")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="company"
          className="text-sm font-medium text-foreground"
        >
          {t("company")} *
        </Label>
        <Input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          placeholder={t("enterCompany")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          {t("contactName")}
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder={t("enterContactNameOptional")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          {t("email")} *
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder={t("enterEmail")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
          {t("phone")}
        </Label>
        <PhoneInput
          id="phone"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="hourlyRate"
          className="text-sm font-medium text-foreground"
        >
          {t("hourlyRate")}
        </Label>
        <Input
          type="number"
          id="hourlyRate"
          name="hourlyRate"
          step="0.01"
          min="0"
          value={formData.hourlyRate || ""}
          onChange={handleChange}
          placeholder={t("enterHourlyRate")}
        />
        <p className="text-sm text-muted-foreground">
          {t("hourlyRateDescription")}
        </p>
      </div>

      {createCompanyMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("errorCreatingClient")}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button
          type="submit"
          disabled={createCompanyMutation.isPending}
          className="w-full"
        >
          {createCompanyMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("creating")}...
            </>
          ) : (
            t("createClient")
          )}
        </Button>
      </div>
    </form>
  );
}
