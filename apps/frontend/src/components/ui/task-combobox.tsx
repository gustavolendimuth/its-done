"use client";

import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityCombobox } from "@/components/ui/entity-combobox";
import { TaskCreateDialog, useTasks } from "@/features/tasks";

import type { Task } from "@/features/tasks";

interface TaskComboboxProps {
  value?: string;
  onSelect: (taskId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
  onTaskAdded?: () => void;
  clientId?: string;
  allowClear?: boolean;
}

export function TaskCombobox({
  value,
  onSelect,
  className,
  disabled = false,
  showAddButton = true,
  onTaskAdded,
  clientId,
  allowClear = true,
}: TaskComboboxProps) {
  const t = useTranslations("tasks");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: tasks = [] } = useTasks(clientId);

  const handleCreateTask = () => {
    setAddDialogOpen(true);
  };

  const handleTaskCreated = (task: Task) => {
    onSelect(task.id);
    setAddDialogOpen(false);
    onTaskAdded?.();
  };

  const handleSelect = (taskId: string) => {
    if (allowClear && taskId === value) {
      onSelect(null);
    } else {
      onSelect(taskId);
    }
  };

  return (
    <>
      <EntityCombobox
        items={tasks}
        value={value}
        onSelect={handleSelect}
        placeholder={t("selectTask")}
        className={className}
        disabled={disabled}
        showAddButton={showAddButton}
        onAddItem={handleCreateTask}
        addButtonLabel={t("addNewTask")}
        noItemsFoundMessage={t("noTasksFound")}
        searchPlaceholder={t("searchTasks")}
        icon={ListChecks}
        getDisplayValue={(task) => task.title}
        getId={(task) => task.id}
        getSearchValue={(task) => task.title}
        renderItem={(task) => (
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 shrink-0 opacity-50" />
            <div className="flex flex-col items-start">
              <span className="font-medium">{task.title}</span>
            </div>
          </div>
        )}
      />

      {addDialogOpen && clientId && (
        <TaskCreateDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          clientId={clientId}
          onSuccess={handleTaskCreated}
        />
      )}
    </>
  );
}
