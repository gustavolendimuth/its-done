"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import * as React from "react";

import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useProjects, type Project } from "@/services/projects";

interface ProjectComboboxProps {
  clientId?: string;
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProjectCombobox({
  clientId,
  value,
  onSelect,
  placeholder = "Select project...",
  disabled = false,
}: ProjectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const { data: projects = [] } = useProjects(clientId);

  const selectedProject = projects.find((project) => project.id === value);

  const handleSelect = (projectId: string) => {
    onSelect(projectId === value ? "" : projectId);
    setOpen(false);
  };

  const handleCreateProject = () => {
    setOpen(false);
    setShowCreateDialog(true);
  };

  const handleProjectCreated = (project: Project) => {
    onSelect(project.id);
    setShowCreateDialog(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedProject ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedProject.name}</span>
                {selectedProject.description && (
                  <span className="text-sm text-muted-foreground">
                    {selectedProject.description}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No projects found.
                  </p>
                  {clientId && (
                    <Button
                      onClick={handleCreateProject}
                      size="sm"
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id}
                    onSelect={() => handleSelect(project.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{project.name}</span>
                      {project.description && (
                        <span className="text-sm text-muted-foreground">
                          {project.description}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {project._count.workHours} work hours
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === project.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
                {clientId && projects.length > 0 && (
                  <CommandItem onSelect={handleCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showCreateDialog && clientId && (
        <ProjectCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clientId={clientId}
          onSuccess={handleProjectCreated}
        />
      )}
    </>
  );
}
