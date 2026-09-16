"use client";

import { Plus, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { InfoCard } from "@/components/ui/info-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/features/clients";
import {
  TaskCard,
  TaskCreateDialog,
  useTasks,
  useDeleteTask,
  TasksPageSkeleton,
} from "@/features/tasks";

export default function TasksPage() {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  const { data: clients = [] } = useClients();
  const { data: tasks = [], isLoading } = useTasks(
    selectedClientId === "all" ? undefined : selectedClientId
  );
  const deleteTask = useDeleteTask();

  const handleDeleteTask = async (taskId: string) => {
    if (confirm(t("confirmDelete"))) {
      try {
        await deleteTask.mutateAsync(taskId);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  if (isLoading) {
    return <TasksPageSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={ListChecks}
        actions={[
          {
            label: t("addTask"),
            icon: Plus,
            onClick: () => setShowCreateDialog(true),
          },
        ]}
      />

      <InfoCard
        title={t("infoTitle")}
        description={t("description")}
        variant="info"
        className="mb-6"
      />

      <div className="flex gap-4 items-center mb-6">
        <div className="flex-1">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder={tCommon("filterByClient")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {tCommon("all")} {tCommon("clients")}
              </SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {tasks.length} {tasks.length !== 1 ? t("tasks") : t("task")}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t("noTasksFound")}
          description={
            selectedClientId === "all" ? t("createFirst") : t("noTasksForClient")
          }
          actions={[
            {
              label: t("addTask"),
              icon: Plus,
              onClick: () => setShowCreateDialog(true),
            },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={handleDeleteTask}
              isDeleting={deleteTask.isPending}
            />
          ))}
        </div>
      )}

      {showCreateDialog && clients.length > 0 && (
        <TaskCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clientId={
            selectedClientId === "all" ? clients[0].id : selectedClientId
          }
          onSuccess={() => setShowCreateDialog(false)}
        />
      )}
    </PageContainer>
  );
}
