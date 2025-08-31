import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import InputMask from "react-input-mask";
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
import { Client } from "@/services/clients";
import { useCreateTimeEntry } from "@/services/time-entries";

const workHourFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  projectId: z.string().optional(),
  hours: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  clientId: z.string().min(1, "Client is required"),
  description: z.string().optional(),
});

type WorkHourFormData = z.infer<typeof workHourFormSchema>;

interface WorkHourFormProps {
  onSuccess?: () => void;
  clients: Client[];
  defaultClientId?: string;
  hideClientSelection?: boolean;
}

export function WorkHourForm({
  onSuccess,
  clients,
  defaultClientId,
  hideClientSelection = false,
}: WorkHourFormProps) {
  const t = useTranslations("workHours");

  const queryClient = useQueryClient();
  const {
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<WorkHourFormData>({
    resolver: zodResolver(workHourFormSchema),
    defaultValues: {
      date: new Date(),
      projectId: "",
      hours: "",
      clientId: defaultClientId || "",
      description: "",
    },
  });

  const selectedClientId = watch("clientId");

  // Reset project when client changes
  useEffect(() => {
    setValue("projectId", "");
  }, [selectedClientId, setValue]);

  const createTimeEntry = useCreateTimeEntry();

  const onSubmit = async (formData: WorkHourFormData) => {
    try {
      const [hours, minutes] = formData.hours.split(":");
      const decimalHours = Number(hours) + Number(minutes) / 60;

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
      console.error("❌ Error creating work hour:", error);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("date")} *
        </Label>
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
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {!hideClientSelection && (
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
              onSelect={field.onChange}
              placeholder={t("selectProject")}
              disabled={!selectedClientId}
            />
          )}
        />
        {errors.projectId && (
          <p className="text-sm text-destructive">{errors.projectId.message}</p>
        )}
        {!selectedClientId && (
          <p className="text-sm text-muted-foreground">
            {t("selectClientFirst")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          {t("hours")} *
        </Label>
        <Controller
          name="hours"
          control={control}
          render={({ field }) => (
            <InputMask
              mask="99:99"
              value={field.value}
              onChange={field.onChange}
              maskChar={null}
            >
              {(inputProps: any) => (
                <Input
                  {...inputProps}
                  type="text"
                  placeholder="HH:mm"
                  className="font-mono"
                />
              )}
            </InputMask>
          )}
        />
        {errors.hours && (
          <p className="text-sm text-destructive">{errors.hours.message}</p>
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
        <Button
          type="submit"
          disabled={createTimeEntry.isPending}
          className="w-full"
        >
          {createTimeEntry.isPending ? (
            <>
              <svg
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
          ) : hideClientSelection ? (
            t("saveTimeEntry")
          ) : (
            t("saveWorkHour")
          )}
        </Button>

        {createTimeEntry.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {t("errorSaving", {
                type: hideClientSelection ? t("timeEntry") : t("workHour"),
              })}
            </AlertDescription>
          </Alert>
        )}

        {createTimeEntry.isSuccess && (
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
