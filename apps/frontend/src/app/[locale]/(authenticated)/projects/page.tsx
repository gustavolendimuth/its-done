"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Folder } from "lucide-react";
import { useProjects, useDeleteProject } from "@/services/projects";
import { useClients } from "@/services/clients";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsBigStats } from "@/components/projects/projects-big-stats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { InfoCard } from "@/components/ui/info-card";

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  const { data: clients = [] } = useClients();
  const { data: projects = [], isLoading } = useProjects(
    selectedClientId === "all" ? undefined : selectedClientId
  );
  const deleteProject = useDeleteProject();

  const handleDeleteProject = async (projectId: string) => {
    if (confirm(t("confirmDelete"))) {
      try {
        await deleteProject.mutateAsync(projectId);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="projects-page" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Folder}
        actions={[
          {
            label: t("addProject"),
            icon: Plus,
            onClick: () => setShowCreateDialog(true),
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
      <ProjectsBigStats selectedClientId={selectedClientId} className="mb-8" />

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
          {projects.length}{" "}
          {projects.length !== 1 ? t("projects") : t("project")}
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={t("noProjectsFound")}
          description={
            selectedClientId === "all" ? t("createFirst") : t("noProjectsFound")
          }
          actions={[
            {
              label: t("addProject"),
              icon: Plus,
              onClick: () => setShowCreateDialog(true),
            },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              isDeleting={deleteProject.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      {showCreateDialog && clients.length > 0 && (
        <ProjectCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clientId={clients[0].id} // Will be changeable in the dialog
          onSuccess={() => setShowCreateDialog(false)}
        />
      )}
    </PageContainer>
  );
}
