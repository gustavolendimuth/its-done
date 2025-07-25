"use client";

import { Users, Plus, Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";

import { ClientCard } from "@/components/clients/client-card";
import { ClientForm } from "@/components/clients/client-form";
import { ClientsBigStats } from "@/components/clients/clients-big-stats";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FormModal } from "@/components/ui/form-modal";
import { InfoCard } from "@/components/ui/info-card";
import { SearchInput } from "@/components/ui/search-input";
import { useClients } from "@/services/clients";


export default function ClientsPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = useClients();
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;

    return clients.filter(
      (client: { company: string; email: string; name?: string }) =>
        client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleClientAdded = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <LoadingSkeleton type="clients-page" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Users}
        actions={[
          {
            label: t("addClient"),
            icon: Plus,
            onClick: () => setIsModalOpen(true),
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title={t("infoTitle")}
        description={t("description")}
        variant="info"
        className="mb-6"
      />

      {/* Big Stats Display */}
      <ClientsBigStats className="mb-8" />

      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder={t("searchClients")}
        className="mb-6"
      />

      {/* Client List */}
      {filteredClients.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={SearchIcon}
            title={t("noClientsFound")}
            description={tCommon("tryAgain")}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={t("noClientsFound")}
            description={t("createFirst")}
            actions={[
              {
                label: t("addClient"),
                icon: Plus,
                onClick: () => setIsModalOpen(true),
              },
            ]}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={t("addNewClient")}
        description={t("addNewClientFormSubtitle")}
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <ClientForm onSuccess={handleClientAdded} />
      </FormModal>
    </PageContainer>
  );
}
