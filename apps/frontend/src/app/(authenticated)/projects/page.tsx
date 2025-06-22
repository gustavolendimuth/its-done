"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  const { data: clients = [] } = useClients();
  const { data: projects = [], isLoading } = useProjects(
    selectedClientId === "all" ? undefined : selectedClientId
  );
  const deleteProject = useDeleteProject();

  const handleDeleteProject = async (projectId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
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
        title="Projects"
        description="Manage your projects and track work hours"
        icon={Folder}
        actions={[
          {
            label: "New Project",
            icon: Plus,
            onClick: () => setShowCreateDialog(true),
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title="Organize Work by Projects"
        description="Create projects for better organization of your work hours. Each project belongs to a client and helps you track time spent on specific tasks or contracts. Monitor progress, view project statistics, and maintain clear separation between different work streams."
        variant="info"
        className="mb-6"
      />

      {/* Big Stats Display */}
      <ProjectsBigStats selectedClientId={selectedClientId} className="mb-8" />

      <div className="flex gap-4 items-center mb-6">
        <div className="flex-1">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No projects found"
          description={
            selectedClientId === "all"
              ? "Create your first project to get started"
              : "No projects found for this client"
          }
          actions={[
            {
              label: "Create Project",
              icon: Plus,
              onClick: () => setShowCreateDialog(true),
            },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
