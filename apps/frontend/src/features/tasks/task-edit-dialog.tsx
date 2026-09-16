"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { parseTaskLink } from "./lib/parse-task-link";
import { useUpdateTask, type Task } from "./tasks.service";

import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { useProjects } from "@/features/projects";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  projectId: z.string().optional(),
  link: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSuccess?: (task: Task) => void;
}

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskEditDialogProps) {
  const updateTask = useUpdateTask();
  const t = useTranslations("TaskEditDialog");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      projectId: task.projectId || "",
      link: task.link || "",
    },
  });

  // Task.clientId is fixed after creation — Story 25 only asks to edit
  // title/link, and a Task's Project must keep belonging to its own Client
  // (Story 28), so reassigning the Client isn't exposed here.
  const { data: projects = [] } = useProjects(task.clientId);

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        projectId: task.projectId || "",
        link: task.link || "",
      });
    }
  }, [task, reset]);

  const handleLinkBlur = () => {
    const link = getValues("link");
    if (!link) return;

    const { suggestedTitle } = parseTaskLink(link);
    if (suggestedTitle && !getValues("title")) {
      setValue("title", suggestedTitle, { shouldDirty: true });
    }
  };

  // Story 25/16: the prefix is a one-time pre-fill applied only the first
  // time a Project is (re)marked in this dialog session — it never
  // auto-resyncs or stacks on later changes, so a previously-saved title is
  // left alone once the prefix has been applied once.
  const hasPrefixedTitleRef = useRef(false);
  const handleProjectSelect = (projectId: string | null) => {
    setValue("projectId", projectId ?? "");

    if (!projectId || hasPrefixedTitleRef.current) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    hasPrefixedTitleRef.current = true;
    const currentTitle = getValues("title");
    setValue("title", `[${project.name}] ${currentTitle}`, {
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const updatedTask = await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: data.title,
          projectId: data.projectId || undefined,
          link: data.link || undefined,
        },
      });

      toast.success(t("success"));
      onSuccess?.(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(t("error"));
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title={t("title")}
      description={t("formSubtitle")}
      icon={ListChecks}
      className="sm:max-w-[600px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label>{t("client")}</Label>
          <p className="text-sm text-muted-foreground">{task.client.company}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">{t("project")}</Label>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <ProjectCombobox
                clientId={task.clientId}
                value={field.value}
                onSelect={handleProjectSelect}
                allowClear
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">{t("link")}</Label>
          <Input
            id="link"
            {...register("link", { onBlur: handleLinkBlur })}
            placeholder={t("enterLink")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t("taskTitle")} *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder={t("enterTitle")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateTask.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={updateTask.isPending}>
            {updateTask.isPending ? t("updating") : t("update")}
          </Button>
        </div>
      </form>
    </FormModal>
  );
}
