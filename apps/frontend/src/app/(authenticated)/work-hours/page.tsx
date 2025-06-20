"use client";

import { WorkHourForm } from "@/components/work-hours/work-hour-form";
import { TotalHoursDisplay } from "@/components/work-hours/total-hours-display";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import { useTimeEntries } from "@/services/time-entries";
import { useClients, Client } from "@/services/clients";
import { formatHoursToHHMM } from "@/lib/utils";
import { InfoCard } from "@/components/ui/info-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

export default function WorkHoursPage() {
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

  return (
    <PageContainer>
      <PageHeader
        title="Work Hours"
        description="Track and manage your work hours across different clients"
        icon={Clock}
        actions={[
          {
            label: "Add Work Hour",
            icon: Plus,
            onClick: () => setIsModalOpen(true),
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title="Smart Time Tracking System"
        description="Record your work hours with precision and organize them by clients and projects. Set custom date ranges, filter by specific clients, and get automatic notifications when you reach your configured hour limits. Perfect for freelancers and consultants."
        variant="info"
        className="mb-8"
      />

      {/* Filters Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Select Period
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
              Filter by Client
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full h-11 bg-gradient-to-r from-background to-muted/20 border-2 border-muted hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
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

      {/* Total Hours Display - Featured */}
      <div className="mb-8">
        <TotalHoursDisplay
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
            Recent Work Hours
          </h2>
          {(() => {
            const length = workHours?.length ?? 0;
            return (
              length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {length} {length === 1 ? "entry" : "entries"} found
                </div>
              )
            );
          })()}
        </div>

        {/* Loading apenas para revalidação */}
        {isRefetching && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Updating...
            </span>
          </div>
        )}

        {workHours?.length === 0 ? (
          <div className="text-center py-12">
            <div>
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No work hours found
              </h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your time by adding your first work hour entry.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Add Work Hour
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workHours?.map((workHour: any) => (
              <div
                key={workHour.id}
                className="bg-card rounded-lg border p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {workHour.client.company}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workHour.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {formatHoursToHHMM(workHour.hours)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workHour.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Add Work Hour"
        description="Record time spent on client projects and track your productivity"
        icon={Clock}
        className="sm:max-w-[600px]"
      >
        <WorkHourForm onSuccess={handleWorkHourAdded} clients={clients || []} />
      </FormModal>
    </PageContainer>
  );
}
