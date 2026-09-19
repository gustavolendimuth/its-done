"use client";

import { useQueryClient } from "@tanstack/react-query";

import { AddressCombobox } from "@/components/ui/address-combobox";
import { Label } from "@/components/ui/label";
import { useCompanyAddresses } from "@/features/companies/addresses";


interface CompanyAddressesProps {
  companyId: string;
}

export function CompanyAddresses({ companyId }: CompanyAddressesProps) {
  const { data: addresses } = useCompanyAddresses(companyId);
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
