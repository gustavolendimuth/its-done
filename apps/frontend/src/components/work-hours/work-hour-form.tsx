import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { Client } from "@/services/clients";
import { useCreateTimeEntry } from "@/services/time-entries";

const workHourSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  projectId: z.string().min(1, "Project is required"),
  hours: z.number().min(0.1, "Hours must be greater than 0"),
  clientId: z.string().min(1, "Client is required"),
});

type WorkHourFormData = z.infer<typeof workHourSchema>;

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
    resolver: zodResolver(workHourSchema),
    defaultValues: {
      date: new Date(),
      projectId: "",
      hours: 0,
      clientId: defaultClientId || "",
    },
  });

  const selectedClientId = watch("clientId");

  // Reset project when client changes
  useEffect(() => {
    setValue("projectId", "");
  }, [selectedClientId, setValue]);

  const createTimeEntry = useCreateTimeEntry();

  const onSubmit = async (data: WorkHourFormData) => {
    try {
      await createTimeEntry.mutateAsync({
        ...data,
        date: data.date.toISOString(),
      });
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating work hour:", error);
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
            <Input
              type="number"
              step="0.1"
              placeholder="0.0"
              {...field}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
        {errors.hours && (
          <p className="text-sm text-destructive">{errors.hours.message}</p>
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
