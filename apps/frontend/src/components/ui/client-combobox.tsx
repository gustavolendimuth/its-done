"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormModal } from "@/components/ui/form-modal";
import { ClientForm } from "@/components/clients/client-form";
import { Client } from "@/types/client";
import { Users } from "lucide-react";

interface ClientComboboxProps {
  clients: Client[];
  value?: string;
  onSelect: (clientId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
  onClientAdded?: () => void;
}

export function ClientCombobox({
  clients,
  value,
  onSelect,
  placeholder = "Select client...",
  className,
  disabled = false,
  showAddButton = true,
  onClientAdded,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const selectedClient = clients.find((client) => client.id === value);

  const handleClientCreated = () => {
    console.log(
      "Client created successfully, closing dialog and calling callback"
    );
    setAddDialogOpen(false);
    setOpen(false); // Close the popover as well
    onClientAdded?.();
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden min-w-0"
            disabled={disabled}
          >
            <span className="truncate text-left min-w-0 max-w-[calc(100%-2rem)]">
              {selectedClient ? selectedClient.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={(currentValue) => {
                      onSelect(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {client.company}
                      </span>
                    </div>
                  </CommandItem>
                ))}
                {showAddButton && !disabled && (
                  <CommandItem
                    onSelect={() => {
                      setAddDialogOpen(true);
                      setOpen(false);
                    }}
                    className="border-t border-border cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new client
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Client Dialog */}
      <FormModal
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Add New Client"
        description="Create a new client profile with contact details and addresses"
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <ClientForm onSuccess={handleClientCreated} />
      </FormModal>
    </div>
  );
}
