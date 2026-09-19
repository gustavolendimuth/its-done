"use client";

import { useQueryClient } from "@tanstack/react-query";

import { AddressCombobox } from "@/components/ui/address-combobox";
import { Label } from "@/components/ui/label";
import { useClientAddresses } from "@/features/companies/addresses";


interface ClientAddressesProps {
  companyId: string;
}

export function ClientAddresses({ companyId }: ClientAddressesProps) {
  const { data: addresses } = useClientAddresses(companyId);
  const queryClient = useQueryClient();

  const handleAddressAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["clients", companyId, "addresses"],
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Addresses</Label>
      <AddressCombobox
        addresses={addresses || []}
        companyId={companyId}
        showAddButton={true}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
}
