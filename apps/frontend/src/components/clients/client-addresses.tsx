"use client";

import { useQueryClient } from "@tanstack/react-query";

import { AddressCombobox } from "@/components/ui/address-combobox";
import { Label } from "@/components/ui/label";
import { useClientAddresses } from "@/services/addresses";


interface ClientAddressesProps {
  clientId: string;
}

export function ClientAddresses({ clientId }: ClientAddressesProps) {
  const { data: addresses } = useClientAddresses(clientId);
  const queryClient = useQueryClient();

  const handleAddressAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["clients", clientId, "addresses"],
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Addresses</Label>
      <AddressCombobox
        addresses={addresses || []}
        clientId={clientId}
        showAddButton={true}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
}
