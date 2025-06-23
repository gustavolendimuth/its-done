"use client";

import { useState } from "react";
import { useCreateClient } from "@/services/clients";
import { useClientAddresses } from "@/services/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressCombobox } from "@/components/ui/address-combobox";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Address } from "@/types/address";
import { Client } from "@/types/client";
import { useTranslations } from "next-intl";

interface ClientFormData {
  name?: string;
  email: string;
  phone?: string;
  company: string;
}

interface ClientFormProps {
  onSuccess?: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const t = useTranslations("clients");
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const { data: addresses } = useClientAddresses(createdClient?.id || "");
  const createClientMutation = useCreateClient();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting client form with data:", formData);

    // Validação básica
    if (!formData.company.trim()) {
      console.error("Company is required");
      return;
    }

    if (!formData.email.trim()) {
      console.error("Email is required");
      return;
    }

    // Limpar campos vazios - apenas dados do cliente
    const cleanClientData = {
      company: formData.company.trim(),
      email: formData.email.trim(),
      ...(formData.name?.trim() && { name: formData.name.trim() }),
      ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
    };

    console.log("Clean client data to be sent:", cleanClientData);

    try {
      console.log("Submitting client:", cleanClientData);
      const createdClient =
        await createClientMutation.mutateAsync(cleanClientData);
      console.log("Client created successfully:", createdClient);

      if (createdClient) {
        console.log("Setting created client:", createdClient);
        setCreatedClient(createdClient);

        // Clear form
        setFormData({
          company: "",
          email: "",
          name: "",
          phone: "",
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }
    } catch (error) {
      console.error("Error creating client:", error);
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
      "Address added successfully, invalidating queries for client:",
      createdClient?.id
    );
    queryClient.invalidateQueries({
      queryKey: ["clients", createdClient?.id, "addresses"],
    });
  };

  const handleFinish = () => {
    setFormData({ name: "", email: "", phone: "", company: "" });
    setCreatedClient(null);
    onSuccess?.();
  };

  const testApiConnection = async () => {
    try {
      console.log("Testing API connection...");
      if (!createdClient) {
        console.error("No client created yet");
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/addresses/client/${createdClient.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      console.log("API test response status:", response.status);
      console.log("API test response headers:", response.headers);
      const data = await response.text();
      console.log("API test response data:", data);
    } catch (error) {
      console.error("API test failed:", error);
    }
  };

  const checkSession = async () => {
    try {
      console.log("🔍 Checking NextAuth session...");
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      console.log("📱 Current session:", session);

      if (!session) {
        console.warn("⚠️ No session found - user is not logged in");
      } else if (!session.accessToken) {
        console.warn("⚠️ Session found but no access token");
      } else {
        console.log("✅ Session and token are valid");
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
    }
  };

  // Se o cliente foi criado, mostrar a seção de endereços
  if (createdClient) {
    console.log("Created client:", createdClient);
    return (
      <div className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <div className="ml-2">
            <p className="font-medium text-foreground">{t("saveSuccess")}</p>
            <p className="text-sm text-muted-foreground">
              {t("nowYouCanAddAddresses", { company: createdClient.company })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("id")}: {createdClient.id}
            </p>
          </div>
        </Alert>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {t("addressesOptional")}
          </Label>
          {createdClient.id ? (
            <AddressCombobox
              addresses={addresses || []}
              placeholder={t("addresses")}
              clientId={createdClient.id}
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
          <Button variant="outline" onClick={() => setCreatedClient(null)}>
            {t("addAnotherClient")}
          </Button>
          <Button variant="ghost" size="sm" onClick={testApiConnection}>
            {t("testApi")}
          </Button>
          <Button variant="ghost" size="sm" onClick={checkSession}>
            {t("checkSession")}
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

      {createClientMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("errorCreatingClient")}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button
          type="submit"
          disabled={createClientMutation.isPending}
          className="w-full"
        >
          {createClientMutation.isPending ? (
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
