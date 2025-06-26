"use client";

import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAddress, useClientAddresses } from "@/services/addresses";

interface AddressFormData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: string;
  isPrimary: boolean;
}

interface AddressFormProps {
  clientId: string;
  onSuccess?: () => void;
}

const ADDRESS_TYPES = [
  { value: "billing", label: "Billing" },
  { value: "shipping", label: "Shipping" },
  { value: "office", label: "Office" },
  { value: "home", label: "Home" },
  { value: "other", label: "Other" },
];

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function AddressForm({ clientId, onSuccess }: AddressFormProps) {
  const { data: existingAddresses } = useClientAddresses(clientId);
  const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

  const [formData, setFormData] = useState<AddressFormData>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brazil",
    type: "billing",
    isPrimary: isFirstAddress,
  });

  useEffect(() => {
    const isFirst = !existingAddresses || existingAddresses.length === 0;

    setFormData((prev) => ({
      ...prev,
      isPrimary: isFirst,
    }));
  }, [existingAddresses]);

  const createAddressMutation = useCreateAddress();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting address form with data:", formData);
    console.log("Client ID being sent:", clientId);

    // Basic validation
    if (!formData.street.trim()) {
      console.error("Street is required");

      return;
    }

    if (!formData.city.trim()) {
      console.error("City is required");

      return;
    }

    if (!formData.state.trim()) {
      console.error("State is required");

      return;
    }

    if (!formData.zipCode.trim()) {
      console.error("ZIP code is required");

      return;
    }

    if (!clientId) {
      console.error("Client ID is required but not provided");

      return;
    }

    // Clean data
    const cleanData = {
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      country: formData.country.trim(),
      type: formData.type,
      isPrimary: formData.isPrimary,
      clientId,
    };

    console.log("Clean data to be sent:", cleanData);

    createAddressMutation.mutate(cleanData, {
      onSuccess: (data) => {
        console.log("Address created successfully:", data);
        // Reset form but keep isPrimary logic for potential next address
        const willBeFirstAfterReset = false; // After creating one, it's no longer the first

        setFormData({
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Brazil",
          type: "billing",
          isPrimary: willBeFirstAfterReset,
        });
        onSuccess?.();
      },
      onError: (error: unknown) => {
        console.error("Error creating address:", error);
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { data?: unknown; status?: number; headers?: unknown };
          };

          console.error("Error details:", axiosError.response?.data);
          if (axiosError.response?.status) {
            console.error("Response status:", axiosError.response.status);
          }
          if (axiosError.response?.headers) {
            console.error("Response headers:", axiosError.response.headers);
          }
        }
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPrimary: checked,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="street" className="text-sm font-medium text-foreground">
          Street Address *
        </Label>
        <Input
          type="text"
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          required
          placeholder="Enter street address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium text-foreground">
            City *
          </Label>
          <Input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Enter city"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="state"
            className="text-sm font-medium text-foreground"
          >
            State *
          </Label>
          <Select
            value={formData.state}
            onValueChange={(value) => handleSelectChange("state", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="zipCode"
            className="text-sm font-medium text-foreground"
          >
            ZIP Code *
          </Label>
          <Input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            placeholder="00000-000"
            maxLength={9}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="country"
            className="text-sm font-medium text-foreground"
          >
            Country
          </Label>
          <Input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country"
            readOnly
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-foreground">
          Address Type
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select address type" />
          </SelectTrigger>
          <SelectContent>
            {ADDRESS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPrimary"
          checked={formData.isPrimary}
          onCheckedChange={handleCheckboxChange}
          disabled={isFirstAddress}
        />
        <Label
          htmlFor="isPrimary"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Set as primary address
          {isFirstAddress && (
            <span className="text-xs text-muted-foreground ml-2">
              (automatically set for first address)
            </span>
          )}
        </Label>
      </div>

      {createAddressMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {(() => {
              const error = createAddressMutation.error;

              if (error && typeof error === "object" && "response" in error) {
                const response = (
                  error as { response?: { data?: { message?: string } } }
                ).response;

                return response?.data?.message;
              }
              if (error && typeof error === "object" && "message" in error) {
                return (error as { message: string }).message;
              }

              return "Error creating address. Please try again.";
            })()}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button
          type="submit"
          disabled={createAddressMutation.isPending}
          className="w-full"
        >
          {createAddressMutation.isPending ? (
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
            "Create Address"
          )}
        </Button>
      </div>
    </form>
  );
}
