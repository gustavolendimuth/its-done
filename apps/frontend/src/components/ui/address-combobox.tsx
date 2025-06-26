"use client";

import { Plus, Edit , MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";



import { AddressForm } from "@/components/addresses/address-form";
import { EditAddressForm } from "@/components/addresses/edit-address-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormModal } from "@/components/ui/form-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Address } from "@/services/addresses";


interface AddressComboboxProps {
  addresses: Address[];
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
  onAddressAdded?: () => void;
  clientId: string; // Required for creating new addresses
}

export function AddressCombobox({
  addresses,
  className,
  disabled = false,
  showAddButton = true,
  onAddressAdded,
  clientId,
}: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("clients");

  useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const handleAddressCreated = () => {
    console.log(
      "Address created successfully, closing dialog and calling callback"
    );
    setAddDialogOpen(false);
    setOpen(false); // Close the popover as well
    onAddressAdded?.();
  };

  const handleAddressUpdated = () => {
    console.log(
      "Address updated successfully, closing dialog and calling callback"
    );
    setEditDialogOpen(false);
    setEditingAddress(null);
    onAddressAdded?.(); // Reuse the same callback to refresh the list
  };

  const handleEditClick = (address: Address, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Edit button clicked for address:", address.id);
    setEditingAddress(address);
    setEditDialogOpen(true);
    setOpen(false); // Close the popover
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between overflow-hidden min-w-0"
            disabled={disabled}
            ref={triggerRef}
          >
            <span className="truncate text-left min-w-0 max-w-[calc(100%-2rem)]">
              {addresses.length > 0 ? (
                <span className="text-muted-foreground text-sm">
                  {addresses.length} address
                  {addresses.length !== 1 ? "es" : ""}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  No addresses
                </span>
              )}
            </span>
            <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: popoverWidth > 0 ? `${popoverWidth}px` : "auto" }}
          align="start"
          sideOffset={4}
        >
          <div className="max-h-64 overflow-auto">
            {addresses.length === 0 ? (
              <div className="py-6 px-4 text-center text-sm text-muted-foreground">
                No addresses yet.
              </div>
            ) : (
              <div className="p-1">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-center justify-between px-3 py-3 text-sm border-b last:border-b-0 hover:bg-muted/50 rounded-sm mx-1"
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {address.isPrimary && (
                            <span className="text-xs">🏠</span>
                          )}
                          <span className="font-medium capitalize text-sm">
                            {address.type}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatAddress(address)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 w-8 p-0 shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0"
                      onClick={(e) => handleEditClick(address, e)}
                      title="Edit address"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Button inside dropdown */}
            {showAddButton && !disabled && (
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setAddDialogOpen(true);
                        setOpen(false);
                      }}
                      className="border-t border-border cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addNewAddress")}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Add Address Dialog */}
      <FormModal
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title={t("addNewAddress")}
        description={t("addNewAddressDescription")}
        icon={MapPin}
        className="sm:max-w-[600px]"
      >
        <AddressForm clientId={clientId} onSuccess={handleAddressCreated} />
      </FormModal>

      {/* Edit Address Dialog */}
      <FormModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Address"
        description="Update address information and location details"
        icon={Edit}
        className="sm:max-w-[600px]"
      >
        {editingAddress && (
          <EditAddressForm
            address={editingAddress}
            onSuccess={handleAddressUpdated}
          />
        )}
      </FormModal>
    </div>
  );
}
