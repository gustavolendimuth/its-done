import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/features/clients";

import { useCreateTimeEntry, useUpdateTimeEntry } from "../time-entries";

import type { CreateTimeEntryDto as FullCreateTimeEntryDto } from "@/types/entities";

/**
 * Máscara de tempo "HH:mm" a partir dos dígitos digitados. Substitui o antigo
 * react-input-mask (mask="99:99"), incompatível com o React 19 por depender de
 * ReactDOM.findDOMNode.
 */
function formatHHmm(input: string): string {
  const digits = String(input ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function formatDateUTC(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function decimalHoursToHHmm(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const hoursFieldSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)");

const workHourFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  projectId: z.string().min(1, "Project is required"),
  hours: hoursFieldSchema,
  clientId: z.string().min(1, "Client is required"),
  description: z.string().optional(),
});

const editWorkHourFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  hours: hoursFieldSchema,
  description: z.string().optional(),
});

type WorkHourFormData = z.infer<typeof workHourFormSchema>;

interface EditableWorkHour {
  id: string;
  date: string;
  hours: number;
  description?: string;
  isInvoiced?: boolean;
}

type EditableFieldName = "date" | "hours" | "description";

interface WorkHourFormProps {
  onSuccess?: () => void;
  clients: Client[];
  defaultClientId?: string;
  hideClientSelection?: boolean;
  workHour?: EditableWorkHour | null;
}

export function WorkHourForm({
  onSuccess,
  clients,
  defaultClientId,
  hideClientSelection = false,
  workHour,
}: WorkHourFormProps) {
  const t = useTranslations("workHours");
  const isEditMode = !!workHour;

  const queryClient = useQueryClient();
  const {
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WorkHourFormData>({
    resolver: zodResolver(
      isEditMode ? editWorkHourFormSchema : workHourFormSchema
    ) as unknown as Resolver<WorkHourFormData>,
    defaultValues: {
      date: workHour ? new Date(workHour.date) : new Date(),
      projectId: "",
      hours: workHour ? decimalHoursToHHmm(workHour.hours) : "",
      clientId: defaultClientId || "",
      description: workHour?.description ?? "",
    },
  });

  const selectedClientId = watch("clientId");
  const isInvoiced = !!workHour?.isInvoiced;

  const [editingFields, setEditingFields] = useState<Set<EditableFieldName>>(
    new Set()
  );
  const isFieldOpen = (field: EditableFieldName) =>
    !isEditMode || editingFields.has(field);
  const openField = (field: EditableFieldName) => {
    if (!isEditMode || isInvoiced) return;
    setEditingFields((prev) => new Set(prev).add(field));
  };
  const hasOpenFields = editingFields.size > 0;

  // Reset project when client changes
  useEffect(() => {
    setValue("projectId", "");
  }, [selectedClientId, setValue]);

  const createTimeEntry = useCreateTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const activeMutation = isEditMode ? updateTimeEntry : createTimeEntry;

  const onSubmit = async (formData: WorkHourFormData) => {
    try {
      const [hours, minutes] = formData.hours.split(":");
      const decimalHours = Number(hours) + Number(minutes) / 60;

      if (isEditMode && workHour) {
        const changed: Partial<FullCreateTimeEntryDto> = {};
        if (dirtyFields.date) changed.date = formData.date.toISOString();
        if (dirtyFields.hours) changed.hours = decimalHours;
        if (dirtyFields.description)
          changed.description = formData.description || undefined;

        await updateTimeEntry.mutateAsync({
          id: workHour.id,
          // SPEC_DEVIATION: cast to the entities.ts CreateTimeEntryDto (which has
          // `description`) because `Partial<CreateTimeEntryDto>` here resolves to
          // the local (description-less) declaration in `@/types/index.ts`, which
          // shadows the fuller one re-exported from `@/types/entities.ts` —
          // pre-existing duplicate-type issue, out of this feature's scope.
          data: changed,
        });

        toast.success(t("savedSuccessfully", { type: t("workHour") }));
        reset(formData);
        setEditingFields(new Set());
        return;
      }

      const payload = {
        ...formData,
        hours: decimalHours,
        date: formData.date.toISOString(),
        projectId: formData.projectId || undefined,
        description: formData.description || undefined,
      };

      console.log("📝 Submitting work hour form with payload:", payload);

      const result = await createTimeEntry.mutateAsync(payload);
      console.log("✅ Work hour created successfully:", result);

      toast.success(t("savedSuccessfully", { type: t("workHour") }));
      reset();

      console.log("🔄 Calling onSuccess callback...");
      onSuccess?.();
      console.log("✅ onSuccess callback completed");
    } catch (error) {
      console.error("❌ Error saving work hour:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("❌ Error response:", error.response.data);
        toast.error(t("errorSaving", { type: t("workHour") }));
      }
    }
  };

  const handleClientAdded = () => {
    // Invalidate clients query to refetch the updated list
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const watchedDate = watch("date");
  const watchedHours = watch("hours");
  const watchedDescription = watch("description");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isEditMode && isInvoiced && (
        <Alert>
          <AlertDescription>{t("cannotEditInvoiced")}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("date")} *
        </Label>
        {isFieldOpen("date") ? (
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePickerComponent
                value={field.value}
                onChange={field.onChange}
                placeholder={t("pickDate")}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            )}
          />
        ) : (
          <button
            type="button"
            data-testid="field-date-view"
            disabled={isInvoiced}
            onClick={() => openField("date")}
            className="w-full text-left text-sm rounded-md border border-input px-3 py-2 disabled:cursor-default disabled:opacity-70"
          >
            {watchedDate ? formatDateUTC(watchedDate) : "—"}
          </button>
        )}
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {!isEditMode && !hideClientSelection && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {t("client")} *
          </Label>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientCombobox
                clients={clients}
                value={field.value}
                onSelect={field.onChange}
                placeholder={t("selectClient")}
                onClientAdded={handleClientAdded}
              />
            )}
          />
          {errors.clientId && (
            <p className="text-sm text-destructive">
              {errors.clientId.message}
            </p>
          )}
        </div>
      )}

      {!isEditMode && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {t("project")} *
          </Label>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <ProjectCombobox
                clientId={selectedClientId}
                value={field.value}
                onSelect={field.onChange}
                placeholder={t("selectProject")}
                disabled={!selectedClientId}
              />
            )}
          />
          {errors.projectId && (
            <p className="text-sm text-destructive">
              {errors.projectId.message}
            </p>
          )}
          {!selectedClientId && (
            <p className="text-sm text-muted-foreground">
              {t("selectClientFirst")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("hours")} *
        </Label>
        {isFieldOpen("hours") ? (
          <Controller
            name="hours"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                className="font-mono"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(formatHHmm(e.target.value))}
                onBlur={field.onBlur}
              />
            )}
          />
        ) : (
          <button
            type="button"
            data-testid="field-hours-view"
            disabled={isInvoiced}
            onClick={() => openField("hours")}
            className="w-full text-left text-sm font-mono rounded-md border border-input px-3 py-2 disabled:cursor-default disabled:opacity-70"
          >
            {watchedHours || "—"}
          </button>
        )}
        {errors.hours && (
          <p className="text-sm text-destructive">{errors.hours.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("hourDescription")}
        </Label>
        {isFieldOpen("description") ? (
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder={t("descriptionPlaceholder")}
                className="min-h-[100px]"
              />
            )}
          />
        ) : (
          <button
            type="button"
            data-testid="field-description-view"
            disabled={isInvoiced}
            onClick={() => openField("description")}
            className="w-full text-left text-sm rounded-md border border-input px-3 py-2 min-h-[100px] disabled:cursor-default disabled:opacity-70"
          >
            {watchedDescription || "—"}
          </button>
        )}
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {(!isEditMode || hasOpenFields) && (
        <Button
          type="submit"
          disabled={activeMutation.isPending}
          className="w-full"
        >
          {activeMutation.isPending ? (
            <>
              <svg
                data-testid="save-spinner"
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("saving")}
            </>
          ) : isEditMode ? (
            t("saveChanges")
          ) : hideClientSelection ? (
            t("saveTimeEntry")
          ) : (
            t("saveWorkHour")
          )}
        </Button>
        )}

        {activeMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {t("errorSaving", {
                type: hideClientSelection ? t("timeEntry") : t("workHour"),
              })}
            </AlertDescription>
          </Alert>
        )}

        {activeMutation.isSuccess && (
          <Alert className="border-primary/20 bg-primary/5 text-primary">
            <AlertDescription>
              {t("savedSuccessfully", {
                type: hideClientSelection ? t("timeEntry") : t("workHour"),
              })}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </form>
  );
}
