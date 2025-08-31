"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ClientForm } from "@/components/clients/client-form";
import { EntityCombobox } from "@/components/ui/entity-combobox";
import { FormModal } from "@/components/ui/form-modal";
import { Client } from "@/services/clients";

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
  className,
  disabled = false,
  showAddButton = true,
  onClientAdded,
}: ClientComboboxProps) {
  const t = useTranslations("clients");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleCreateClient = () => {
    setAddDialogOpen(true);
  };

  const handleClientCreated = () => {
    setAddDialogOpen(false);
    onClientAdded?.();
  };

  const getSearchString = (client: Client) => {
    const searchParts = [client.company, client.name, client.email].filter(
      Boolean
    );

    return searchParts.join(" ");
  };

  return (
    <>
      <EntityCombobox
        items={clients}
        value={value}
        onSelect={onSelect}
        placeholder={t("selectClient")}
        className={className}
        disabled={disabled}
        showAddButton={showAddButton}
        onAddItem={handleCreateClient}
        addButtonLabel={t("addNewClient")}
        noItemsFoundMessage={t("noClientsFound")}
        searchPlaceholder={t("searchClients")}
        icon={Building2}
        getDisplayValue={(client) => client.company}
        getId={(client) => client.id}
        getSearchValue={getSearchString}
        renderItem={(client) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 opacity-50" />
            <div className="flex flex-col items-start">
              <span className="font-medium">{client.company}</span>
              {client.name && (
                <span className="text-sm text-muted-foreground">
                  {client.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {client.email}
              </span>
            </div>
          </div>
        )}
      />

      {/* Add Client Dialog */}
      {addDialogOpen && (
        <FormModal
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          title={t("addNewClient")}
          description={t("addNewClientFormSubtitle")}
          icon={Building2}
          className="sm:max-w-[600px]"
        >
          <ClientForm onSuccess={handleClientCreated} />
        </FormModal>
      )}
    </>
  );
}
