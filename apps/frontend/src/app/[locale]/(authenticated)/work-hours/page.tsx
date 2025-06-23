"use client";

import { WorkHourForm } from "@/components/work-hours/work-hour-form";
import { WorkHoursBigStats } from "@/components/work-hours/work-hours-big-stats";
import { WorkHourCard } from "@/components/work-hours/work-hour-card";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PeriodSelectorV2 } from "@/components/ui/period-selector-v2";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus } from "lucide-react";
import { useWorkHoursStats } from "@/services/work-hours-stats";
import { useTimeEntries, useDeleteTimeEntry } from "@/services/time-entries";
import { useClients, Client } from "@/services/clients";
import { formatHoursToHHMM } from "@/lib/utils";
import { InfoCard } from "@/components/ui/info-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

export default function WorkHoursPage() {
  const t = useTranslations("workHours");
  const tCommon = useTranslations("common");

  // Inicializar com datas estáveis
  const initialDateRange = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: firstDayOfMonth,
      endDate: today,
    };
  }, []);

  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>(initialDateRange);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Memoizar as datas para evitar recriações desnecessárias
  const queryParams = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return null;
    return {
      from: dateRange.startDate.toISOString(),
      to: dateRange.endDate.toISOString(),
      clientId: selectedClient !== "all" ? selectedClient : undefined,
    };
  }, [dateRange.startDate, dateRange.endDate, selectedClient]);

  const {
    data: workHours,
    isLoading: isLoadingWorkHours,
    isFetching: isFetchingWorkHours,
    error: workHoursError,
  } = useTimeEntries(queryParams || undefined);

  const {
    data: clients,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useClients();

  // Estatísticas
  const { data: stats } = useWorkHoursStats(queryParams || undefined);

  // Delete mutation
  const deleteTimeEntry = useDeleteTimeEntry();

  // Distinguir entre carregamento inicial e revalidação
  const isInitialLoading = isLoadingWorkHours || isLoadingClients;
  const isRefetching = isFetchingWorkHours && !isLoadingWorkHours;

  // Se houver erro de autenticação, o middleware irá redirecionar para o login
  if (workHoursError || clientsError) {
    return null;
  }

  // Skeleton para carregamento inicial
  if (isInitialLoading) {
    return <LoadingSkeleton type="work-hours" />;
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleWorkHourAdded = () => {
    setIsModalOpen(false);
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar edição de work hour
    console.log("Edit work hour:", id);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTimeEntry.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting work hour:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Clock}
        actions={[
          {
            label: t("addHours"),
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
        className="mb-8"
      />

      {/* Filters Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              {tCommon("selectPeriod")}
            </label>
            <PeriodSelectorV2
              value={dateRange}
              onChange={setDateRange}
              className="w-full"
            />
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              {tCommon("filterByClient")}
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full h-11 bg-gradient-to-r from-background to-muted/20 border-2 border-muted hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200">
                <SelectValue placeholder={t("selectClient")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tCommon("all")} {t("clients")}
                </SelectItem>
                {clients?.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name
                      ? `${client.company} (${client.name})`
                      : client.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Big Stats Display */}
      <div className="mb-8">
        <WorkHoursBigStats
          dateRange={dateRange}
          clientId={selectedClient}
          hourlyRate={50} // Pode ser dinâmico no futuro
          workHours={workHours || []}
          isRefetching={isRefetching}
        />
      </div>

      {/* Work Hours List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {t("recentWork")}
          </h2>
          {(() => {
            const length = workHours?.length ?? 0;
            return (
              length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {length}{" "}
                  {length === 1 ? tCommon("entry") : tCommon("entries")}{" "}
                  {tCommon("found")}
                </div>
              )
            );
          })()}
        </div>

        {/* Loading indicator for refetching */}
        {isRefetching && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              {tCommon("loading")}...
            </div>
          </div>
        )}

        {/* Work Hours Grid */}
        {workHours && workHours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {workHours
              .filter((workHour) => workHour.client) // Filtra apenas work hours com cliente
              .map((workHour) => (
                <WorkHourCard
                  key={workHour.id}
                  workHour={workHour}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deletingId === workHour.id}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t("noWorkHours")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("noWorkHoursDescription")}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addHours")}
            </Button>
          </div>
        )}
      </div>

      {/* Add Work Hour Modal */}
      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={t("addHours")}
        description={t("addHoursFormSubtitle")}
        icon={Clock}
      >
        <WorkHourForm onSuccess={handleWorkHourAdded} clients={clients || []} />
      </FormModal>
    </PageContainer>
  );
}
