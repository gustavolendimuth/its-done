"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FolderPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/services/clients";
import { useCreateProject, type Project } from "@/services/projects";

const projectSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string().optional(),
  hourlyRate: z.number().min(0, { message: "Hourly rate must be 0 or greater" }).optional().nullable(),
  alertHours: z.number().min(0, { message: "Alert hours must be 0 or greater" }).optional().nullable(),
  clientId: z.string().min(1, { message: "Client is required" }),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: (project: Project) => void;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: ProjectCreateDialogProps) {
  const createProject = useCreateProject();
  const { data: clients = [] } = useClients();
  const t = useTranslations("ProjectCreateDialog");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: clientId || "",
      hourlyRate: null,
      alertHours: null,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Convert null to undefined for hourlyRate and alertHours to match API expectations
      const formattedData = {
        ...data,
        hourlyRate: data.hourlyRate === null ? undefined : data.hourlyRate,
        alertHours: data.alertHours === null ? undefined : data.alertHours
      };

      const project = await createProject.mutateAsync(formattedData);

      toast.success(t("success"));
      reset();
      onSuccess?.(project);
    } catch (error) {
      console.error("Error creating project:", error);
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
      icon={FolderPlus}
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
                placeholder={t("selectClient", { defaultMessage: "Select a client" })}
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
          <Label htmlFor="name">{t("projectName")} *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("enterName", { defaultMessage: "Enter project name" })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">{t("hourlyRate")}</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            {...register("hourlyRate", { 
              valueAsNumber: true,
              setValueAs: v => v === "" ? null : Number(v)
            })}
            placeholder={t("enterHourlyRate", { defaultMessage: "Enter hourly rate (optional)" })}
          />
          {errors && (errors as any).hourlyRate && (
            <p className="text-sm text-destructive">
              {(errors as any).hourlyRate?.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="alertHours">{t("alertHours")}</Label>
          <Input
            id="alertHours"
            type="number"
            step="1"
            min="0"
            {...register("alertHours", {
              valueAsNumber: true,
              setValueAs: v => v === "" ? null : Number(v)
            })}
            placeholder={t("alertHoursPlaceholder", { defaultMessage: "e.g., 160" })}
          />
          <p className="text-sm text-muted-foreground">
            {t("alertHoursDescription")}
          </p>
          {errors && (errors as any).alertHours && (
            <p className="text-sm text-destructive">
              {(errors as any).alertHours?.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder={t("enterDescription", { defaultMessage: "Enter project description (optional)" })}
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createProject.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? t("creating") : t("create")}
          </Button>
        </div>
      </form>
    </FormModal>
  );
}
