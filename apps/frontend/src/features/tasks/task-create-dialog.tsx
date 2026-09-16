"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { parseTaskLink } from "./lib/parse-task-link";
import { useCreateTask, type Task } from "./tasks.service";

import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { useClients } from "@/features/clients";
import { useProjects } from "@/features/projects";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  clientId: z.string().min(1, { message: "Client is required" }),
  projectId: z.string().optional(),
  link: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: (task: Task) => void;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: TaskCreateDialogProps) {
  const createTask = useCreateTask();
  const { data: clients = [] } = useClients();
  const t = useTranslations("TaskCreateDialog");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      clientId: clientId || "",
      projectId: "",
      title: "",
      link: "",
    },
  });

  const selectedClientId = watch("clientId");
  const { data: projects = [] } = useProjects(selectedClientId);

  // Story 3/4: when the pasted link itself carries the info (Jira key,
  // Linear key + title), pre-fill the title — still freely editable
  // afterwards. Never overwrites a title the user already typed.
  const handleLinkBlur = () => {
    const link = getValues("link");
    if (!link) return;

    const { suggestedTitle } = parseTaskLink(link);
    if (suggestedTitle && !getValues("title")) {
      setValue("title", suggestedTitle, { shouldDirty: true });
    }
  };

  // Story 16: marking a Project prefixes the current title with
  // "[project name] " — a one-time pre-fill applied only the first time a
  // Project is marked in this dialog. Picking a different Project afterward
  // (or unmarking/re-marking) never touches the title again, so the prefix
  // is never resynced/stacked — matches "não é resincronizado
  // automaticamente se o Project for trocado ou desmarcado depois".
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
      const task = await createTask.mutateAsync({
        title: data.title,
        clientId: data.clientId,
        projectId: data.projectId || undefined,
        link: data.link || undefined,
      });

      toast.success(t("success"));
      reset();
      onSuccess?.(task);
    } catch (error) {
      console.error("Error creating task:", error);
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">{t("client")} *</Label>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientCombobox
                clients={clients}
                value={field.value}
                onSelect={field.onChange}
                placeholder={t("selectClient")}
              />
            )}
          />
          {errors.clientId && (
            <p className="text-sm text-destructive">
              {errors.clientId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">{t("project")}</Label>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <ProjectCombobox
                clientId={selectedClientId}
                value={field.value}
                onSelect={handleProjectSelect}
                disabled={!selectedClientId}
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
            disabled={createTask.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? t("creating") : t("create")}
          </Button>
        </div>
      </form>
    </FormModal>
  );
}
