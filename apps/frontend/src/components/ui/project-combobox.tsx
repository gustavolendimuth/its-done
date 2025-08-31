"use client";

import { Folder } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { EntityCombobox } from "@/components/ui/entity-combobox";
import { useProjects } from "@/services/projects";

import type { Project } from "@/services/projects";

interface ProjectComboboxProps {
  value?: string;
  onSelect: (projectId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
  onProjectAdded?: () => void;
  clientId?: string;
  allowClear?: boolean;
}

export function ProjectCombobox({
  value,
  onSelect,
  className,
  disabled = false,
  showAddButton = true,
  onProjectAdded,
  clientId,
  allowClear = false,
}: ProjectComboboxProps) {
  const t = useTranslations("projects");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: projects = [] } = useProjects(clientId);

  const handleCreateProject = () => {
    setAddDialogOpen(true);
  };

  const handleProjectCreated = (project: Project) => {
    onSelect(project.id);
    setAddDialogOpen(false);
    onProjectAdded?.();
  };

  const handleSelect = (projectId: string) => {
    if (allowClear && projectId === value) {
      onSelect(null);
    } else {
      onSelect(projectId);
    }
  };

  return (
    <>
      <EntityCombobox
        items={projects}
        value={value}
        onSelect={handleSelect}
        placeholder={t("selectProject")}
        className={className}
        disabled={disabled}
        showAddButton={showAddButton}
        onAddItem={handleCreateProject}
        addButtonLabel={t("addNewProject")}
        noItemsFoundMessage={t("noProjectsFound")}
        searchPlaceholder={t("searchProjects")}
        icon={Folder}
        getDisplayValue={(project) => project.name}
        getId={(project) => project.id}
        getSearchValue={(project) => project.name}
        renderItem={(project) => (
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 shrink-0 opacity-50" />
            <div className="flex flex-col items-start">
              <span className="font-medium">{project.name}</span>
            </div>
          </div>
        )}
      />

      {/* Add Project Dialog */}
      {addDialogOpen && clientId && (
        <ProjectCreateDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          clientId={clientId}
          onSuccess={handleProjectCreated}
        />
      )}
    </>
  );
}
