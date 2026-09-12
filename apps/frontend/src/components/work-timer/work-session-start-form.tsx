"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { Textarea } from "@/components/ui/textarea";
import { start } from "@/lib/work-timer-engine";
import { useClients } from "@/services/clients";

export interface WorkSessionStartFormProps {
  onCancel: () => void;
}

type TranslateFn = (key: string) => string;

function buildStartFormSchema(t: TranslateFn) {
  return z.object({
    clientId: z.string().min(1, t("clientRequired")),
    projectId: z.string().optional(),
    description: z.string().min(1, t("descriptionRequired")),
  });
}

type StartFormData = z.infer<ReturnType<typeof buildStartFormSchema>>;

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

// Rendered inline by WorkTimerWidget when the user picks the "start with
// details" option instead of the plain "Iniciar" button (spec.md P2
// "Preencher detalhes antes de iniciar", WKT-10). Like the finish form, this
// isn't local-first: loading client/project options needs a connection —
// only the timer itself (start/count/stop) is local-first.
export function WorkSessionStartForm({ onCancel }: WorkSessionStartFormProps) {
  const t = useTranslations("WorkSessionStartForm");
  const isOnline = useOnlineStatus();
  const { data: clients = [] } = useClients();
  const startFormSchema = useMemo(() => buildStartFormSchema(t), [t]);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StartFormData>({
    resolver: zodResolver(startFormSchema),
    defaultValues: { clientId: "", projectId: "", description: "" },
  });

  const selectedClientId = watch("clientId");

  const onSubmit = async (data: StartFormData) => {
    await start({
      clientId: data.clientId,
      projectId: data.projectId || undefined,
      description: data.description,
    });
  };

  if (!isOnline) {
    return (
      <Card
        data-testid="work-session-start-form-offline"
        className="fixed bottom-4 right-4 z-50 w-96 border-green-200 dark:border-green-800"
      >
        <CardContent className="p-4 text-sm text-muted-foreground">
          {t("offlineNotice")}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">
            {t("cancel")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid="work-session-start-form"
      className="fixed bottom-4 right-4 z-50 w-96 border-green-200 dark:border-green-800"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("clientLabel")}</Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <ClientCombobox
                  clients={clients}
                  value={field.value}
                  onSelect={field.onChange}
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
            <Label>{t("projectLabel")}</Label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <ProjectCombobox
                  clientId={selectedClientId}
                  value={field.value}
                  onSelect={(projectId) => field.onChange(projectId ?? "")}
                  disabled={!selectedClientId}
                  allowClear
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("descriptionLabel")}</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder={t("descriptionPlaceholder")} />
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("starting") : t("start")}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
