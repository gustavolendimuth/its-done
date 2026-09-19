"use client";

import { Users, Plus, Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FormModal } from "@/components/ui/form-modal";
import { InfoCard } from "@/components/ui/info-card";
import { SearchInput } from "@/components/ui/search-input";
import { CompaniesPageSkeleton , CompanyCard, CompanyForm, CompaniesBigStats, useCompanies } from "@/features/companies";

export default function ClientsPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = useCompanies();
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
    return <CompaniesPageSkeleton />;
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
      <CompaniesBigStats className="mb-8" />

      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder={t("searchClients")}
        className="mb-6"
      />

      {/* Company List */}
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
            <CompanyCard key={client.id} company={client} />
          ))}
        </div>
      )}

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={t("addNewClient")}
        description={t("createClientFormSubtitle")}
        icon={Users}
        className="sm:max-w-[600px]"
      >
        <CompanyForm onSuccess={handleClientAdded} />
      </FormModal>
    </PageContainer>
  );
}
