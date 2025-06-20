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
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [createdClient, setCreatedClient] = useState<any>(null);
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

    createClientMutation.mutate(cleanClientData, {
      onSuccess: (data) => {
        console.log("Client created successfully:", data);
        setCreatedClient(data);
      },
      onError: (error: any) => {
        console.error("Error creating client:", error);
        console.error("Error details:", error.response?.data);
      },
    });
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
            <p className="font-medium text-foreground">
              Client created successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Now you can add addresses for {createdClient.company}
            </p>
            <p className="text-xs text-muted-foreground">
              Client ID: {createdClient.id}
            </p>
          </div>
        </Alert>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Addresses (Optional)
          </Label>
          {createdClient.id ? (
            <AddressCombobox
              addresses={addresses || []}
              placeholder="Addresses"
              clientId={createdClient.id}
              showAddButton={true}
              onAddressAdded={handleAddressAdded}
            />
          ) : (
            <div className="text-sm text-red-500">
              Error: Client ID not available
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleFinish} className="flex-1">
            Finish
          </Button>
          <Button variant="outline" onClick={() => setCreatedClient(null)}>
            Add Another Client
          </Button>
          <Button variant="ghost" size="sm" onClick={testApiConnection}>
            Test API
          </Button>
          <Button variant="ghost" size="sm" onClick={checkSession}>
            Check Session
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
          Company *
        </Label>
        <Input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          placeholder="Enter company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          Contact Name
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder="Enter contact person name (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email *
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter client email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone
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
          <AlertDescription>
            Error creating client. Please try again.
          </AlertDescription>
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
              Creating...
            </>
          ) : (
            "Create Client"
          )}
        </Button>
      </div>
    </form>
  );
}
