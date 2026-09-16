import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
import { TaskCombobox } from "@/components/ui/task-combobox";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/features/clients";

import { useCreateTimeEntry, useUpdateTimeEntry } from "../time-entries";

import type { CreateTimeEntryDto as FullCreateTimeEntryDto } from "@/types/entities";

type EntryMode = "duration" | "interval";

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

function decimalHoursToHHmm(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isFullHHmm(value: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value ?? "");
}

// Um valor com só 1-2 dígitos e sem ":" é interpretado como "só a hora" e
// ganha ":00" - tanto no blur (feedback visual) quanto na validação do zod
// (garante o mesmo resultado se o Enter disparar o submit sem passar por blur).
function normalizeHourOnly(value: string): string {
  return /^\d{1,2}$/.test(value ?? "") ? `${value.padStart(2, "0")}:00` : value;
}

function hmToDecimal(value: string): number {
  const [h, m] = value.split(":");
  return Number(h) + Number(m) / 60;
}

function hasStoredInterval(workHour?: EditableWorkHour | null): boolean {
  return !!(workHour?.startTime && workHour?.endTime);
}

function buildSchema(
  t: (key: string) => string,
  mode: EntryMode,
  includeClientProject: boolean
) {
  const timeField = z.string().transform(normalizeHourOnly);
  const shape: Record<string, z.ZodTypeAny> = {
    date: z.date({
      required_error: "Please select a date",
    }),
    description: z.string().optional(),
    hours: timeField,
    startTime: timeField,
    endTime: timeField,
  };
  if (includeClientProject) {
    shape.clientId = z.string().min(1, "Client is required");
    // Story 8 (MW-5): Project is optional — dev work logged without one
    // must not be forced into inventing a fake Project just to satisfy the
    // form. Client is still required (mirrors the backend, which always
    // needs a clientId).
    shape.projectId = z.string().optional();
    shape.taskId = z.string().optional();
  }

  return z.object(shape).superRefine((data, ctx) => {
    if (mode === "duration") {
      if (!isFullHHmm(data.hours as string)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hours"],
          message: t("invalidTimeFormat"),
        });
      }
      return;
    }

    const startOk = isFullHHmm(data.startTime as string);
    const endOk = isFullHHmm(data.endTime as string);
    if (!startOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: t("invalidTimeFormat"),
      });
    }
    if (!endOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: t("invalidTimeFormat"),
      });
    }
    if (
      startOk &&
      endOk &&
      hmToDecimal(data.endTime as string) <= hmToDecimal(data.startTime as string)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: t("endTimeBeforeStart"),
      });
    }
  });
}

type WorkHourFormData = {
  date: Date;
  description?: string;
  hours: string;
  startTime: string;
  endTime: string;
  clientId?: string;
  projectId?: string;
  taskId?: string;
};

interface EditableWorkHour {
  id: string;
  date: string;
  hours: number;
  startTime?: string | null;
  endTime?: string | null;
  description?: string;
  isInvoiced?: boolean;
}

interface WorkHourFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  clients: Client[];
  defaultClientId?: string;
  hideClientSelection?: boolean;
  workHour?: EditableWorkHour | null;
}

export function WorkHourForm({
  onSuccess,
  onCancel,
  clients,
  defaultClientId,
  hideClientSelection = false,
  workHour,
}: WorkHourFormProps) {
  const t = useTranslations("workHours");
  const tCommon = useTranslations("common");
  const isEditMode = !!workHour;

  const queryClient = useQueryClient();

  const [entryMode, setEntryMode] = useState<EntryMode>(() =>
    hasStoredInterval(workHour) ? "interval" : "duration"
  );
  const [lastSavedMode, setLastSavedMode] = useState<EntryMode>(entryMode);

  const schema = useMemo(
    () => buildSchema(t, entryMode, !isEditMode),
    [t, entryMode, isEditMode]
  );

  const {
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WorkHourFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<WorkHourFormData>,
    defaultValues: {
      date: workHour ? new Date(workHour.date) : new Date(),
      projectId: "",
      taskId: "",
      hours: workHour ? decimalHoursToHHmm(workHour.hours) : "",
      startTime: workHour?.startTime ?? "",
      endTime: workHour?.endTime ?? "",
      clientId: defaultClientId || "",
      description: workHour?.description ?? "",
    },
  });

  const selectedClientId = watch("clientId");
  const isInvoiced = !!workHour?.isInvoiced;
  const fieldsDisabled = isEditMode && isInvoiced;

  // Reset project/task when client changes
  useEffect(() => {
    setValue("projectId", "");
    setValue("taskId", "");
  }, [selectedClientId, setValue]);

  const createTimeEntry = useCreateTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const activeMutation = isEditMode ? updateTimeEntry : createTimeEntry;

  const handleModeChange = (next: EntryMode) => {
    if (next === entryMode || fieldsDisabled) return;
    if (next === "duration") {
      const st = getValues("startTime");
      const et = getValues("endTime");
      if (isFullHHmm(st) && isFullHHmm(et) && hmToDecimal(et) > hmToDecimal(st)) {
        setValue("hours", decimalHoursToHHmm(hmToDecimal(et) - hmToDecimal(st)), {
          shouldDirty: true,
        });
      }
    }
    setEntryMode(next);
  };

  const handleTimeBlur =
    (field: { value: string; onChange: (v: string) => void; onBlur: () => void }) =>
    () => {
      if (/^\d{1,2}$/.test(field.value ?? "")) {
        field.onChange(normalizeHourOnly(field.value));
      }
      field.onBlur();
    };

  const onSubmit = async (formData: WorkHourFormData) => {
    try {
      const decimalHours =
        entryMode === "duration"
          ? hmToDecimal(formData.hours)
          : hmToDecimal(formData.endTime) - hmToDecimal(formData.startTime);

      if (isEditMode && workHour) {
        const changed: Partial<FullCreateTimeEntryDto> = {};
        if (dirtyFields.date) changed.date = formData.date.toISOString();
        if (entryMode === "duration") {
          if (dirtyFields.hours) changed.hours = decimalHours;
        } else {
          if (dirtyFields.startTime) changed.startTime = formData.startTime;
          if (dirtyFields.endTime) changed.endTime = formData.endTime;
          if (dirtyFields.startTime || dirtyFields.endTime)
            changed.hours = decimalHours;
        }
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
        setLastSavedMode(entryMode);
        return;
      }

      const payload: Record<string, unknown> = {
        date: formData.date.toISOString(),
        hours: decimalHours,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        taskId: formData.taskId || undefined,
        description: formData.description || undefined,
      };
      if (entryMode === "interval") {
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
      }

      console.log("📝 Submitting work hour form with payload:", payload);

      const result = await createTimeEntry.mutateAsync(
        payload as unknown as FullCreateTimeEntryDto
      );
      console.log("✅ Work hour created successfully:", result);

      toast.success(t("savedSuccessfully", { type: t("workHour") }));
      reset();
      setEntryMode("duration");
      setLastSavedMode("duration");

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

  const handleCancel = () => {
    reset();
    setEntryMode(lastSavedMode);
    onCancel?.();
  };

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
        <div
          data-testid="date-field-wrapper"
          className={
            fieldsDisabled ? "pointer-events-none opacity-70" : undefined
          }
        >
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
        </div>
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
                value={field.value ?? ""}
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
            {t("project")}
          </Label>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <ProjectCombobox
                clientId={selectedClientId}
                value={field.value}
                onSelect={(projectId) => field.onChange(projectId ?? "")}
                placeholder={t("selectProject")}
                disabled={!selectedClientId}
                allowClear
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

      {!isEditMode && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {t("task")}
          </Label>
          <Controller
            name="taskId"
            control={control}
            render={({ field }) => (
              <TaskCombobox
                clientId={selectedClientId}
                value={field.value}
                onSelect={(taskId) => field.onChange(taskId ?? "")}
                disabled={!selectedClientId}
                allowClear
              />
            )}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("hours")} *
        </Label>

        <div className="flex gap-2" role="group" aria-label={t("entryMode")}>
          <Button
            type="button"
            variant={entryMode === "duration" ? "default" : "outline"}
            size="sm"
            aria-pressed={entryMode === "duration"}
            disabled={fieldsDisabled}
            onClick={() => handleModeChange("duration")}
          >
            {t("durationMode")}
          </Button>
          <Button
            type="button"
            variant={entryMode === "interval" ? "default" : "outline"}
            size="sm"
            aria-pressed={entryMode === "interval"}
            disabled={fieldsDisabled}
            onClick={() => handleModeChange("interval")}
          >
            {t("intervalMode")}
          </Button>
        </div>

        {entryMode === "duration" ? (
          <>
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
                  onBlur={handleTimeBlur(field)}
                  disabled={fieldsDisabled}
                />
              )}
            />
            {errors.hours && (
              <p className="text-sm text-destructive">{errors.hours.message}</p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("startTime")}
              </Label>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    className="font-mono"
                    data-testid="start-time-input"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatHHmm(e.target.value))}
                    onBlur={handleTimeBlur(field)}
                    disabled={fieldsDisabled}
                  />
                )}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("endTime")}
              </Label>
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    className="font-mono"
                    data-testid="end-time-input"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatHHmm(e.target.value))}
                    onBlur={handleTimeBlur(field)}
                    disabled={fieldsDisabled}
                  />
                )}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("hourDescription")}
        </Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder={t("descriptionPlaceholder")}
              className="min-h-[100px]"
              disabled={fieldsDisabled}
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className={isEditMode ? "flex gap-3" : undefined}>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={activeMutation.isPending}
              className="flex-1"
            >
              {tCommon("cancel")}
            </Button>
          )}
          <Button
            type="submit"
            disabled={activeMutation.isPending || fieldsDisabled}
            className={isEditMode ? "flex-1" : "w-full"}
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
        </div>

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
