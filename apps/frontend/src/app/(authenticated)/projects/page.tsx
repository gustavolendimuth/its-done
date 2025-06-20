"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Folder, Building2 } from "lucide-react";
import { useProjects, useDeleteProject } from "@/services/projects";
import { useClients } from "@/services/clients";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { formatHoursToHHMM } from "@/lib/utils";
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
    return <LoadingSkeleton type="card" count={6} />;
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
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {project.client.company}
                      </span>
                    </div>
                  </div>
                  <Badge variant="info" className="ml-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {project._count.workHours} entradas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(new Date(project.createdAt))} ago
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(`/clients/${project.clientId}`, "_blank")
                    }
                  >
                    <Folder className="h-3 w-3 mr-1" />
                    View Client
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    disabled={deleteProject.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
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
