"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { TaskCombobox } from "@/components/ui/task-combobox";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/features/clients";

import type { StartDetails } from "../lib/work-timer-engine";

export interface WorkSessionStartFormProps {
  onCancel: () => void;
  // Delegated to the caller (WorkTimerWidget) rather than calling
  // work-timer-engine's start() directly, so the widget's one-time push
  // permission prompt (WKT-04 AC1) fires for this path too, exactly like
  // the plain "Iniciar" button.
  onStart: (details: StartDetails) => void | Promise<void>;
}

type TranslateFn = (key: string) => string;

function buildStartFormSchema(t: TranslateFn) {
  return z.object({
    clientId: z.string().min(1, t("clientRequired")),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
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
export function WorkSessionStartForm({
  onCancel,
  onStart,
}: WorkSessionStartFormProps) {
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
    defaultValues: { clientId: "", projectId: "", taskId: "", description: "" },
  });

  const selectedClientId = watch("clientId");

  const onSubmit = async (data: StartFormData) => {
    await onStart({
      clientId: data.clientId,
      projectId: data.projectId || undefined,
      taskId: data.taskId || undefined,
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
      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/10 dark:bg-green-400/10">
            <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400" />
          </span>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </div>
        <CardDescription className="pl-10">{t("description")}</CardDescription>
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
            <Label>{t("taskLabel")}</Label>
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
