"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { Textarea } from "@/components/ui/textarea";
import { reset } from "../lib/work-timer-engine";
import { useClients } from "@/services/clients";
import {
  useFinishWorkSession,
  useWorkTimerEngine,
} from "@/services/work-sessions";

import type { LocalWorkSession } from "../lib/work-timer-db";

export interface WorkSessionFinishFormProps {
  session: LocalWorkSession;
  onSuccess: () => void;
}

// The zod schema is built from translated messages, so it's constructed
// inside the component (see buildFinishFormSchema below) rather than as a
// module-level constant — it needs `t` from useTranslations, which is only
// available once rendering has started.
type TranslateFn = (key: string) => string;

function buildFinishFormSchema(t: TranslateFn) {
  return z.object({
    clientId: z.string().min(1, t("clientRequired")),
    projectId: z.string().optional(),
    description: z.string().min(1, t("descriptionRequired")),
    date: z.date({ required_error: t("dateRequired") }),
  });
}

type FinishFormData = z.infer<ReturnType<typeof buildFinishFormSchema>>;

// Mirrors the HH:MM rounding already applied by work-timer-engine.stop()
// (session.hours) — this only formats it for display, no rounding happens
// here.
function formatHours(hours: number | null | undefined): string {
  const totalMinutes = Math.round((hours ?? 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

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

// Rendered inline by WorkTimerWidget once the session reaches STOPPING
// (spec.md P1 "Encerrar sessão e preencher detalhes", WKT-06). Unlike the
// rest of the timer, this form is NOT local-first: it needs a connection to
// load client/project options, so it gates on connectivity (AC1) instead of
// working offline.
export function WorkSessionFinishForm({
  session,
  onSuccess,
}: WorkSessionFinishFormProps) {
  const t = useTranslations("WorkSessionFinishForm");
  const isOnline = useOnlineStatus();
  const { data: clients = [] } = useClients();
  const { discard } = useWorkTimerEngine();
  const finishMutation = useFinishWorkSession();
  const [discardOpen, setDiscardOpen] = useState(false);
  const finishFormSchema = useMemo(() => buildFinishFormSchema(t), [t]);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FinishFormData>({
    resolver: zodResolver(finishFormSchema),
    // WKT-10: pre-fills client/project/description when the session was
    // started with upfront details — still editable here. WKT-11: the date
    // defaults to the day the session actually STARTED, not today, since
    // the person may only be filling this in days later.
    defaultValues: {
      clientId: session.clientId ?? "",
      projectId: session.projectId ?? "",
      description: session.description ?? "",
      date: new Date(session.startedAt),
    },
  });

  const selectedClientId = watch("clientId");

  const onSubmit = async (data: FinishFormData) => {
    await finishMutation.mutateAsync({
      sessionId: session.id,
      data: {
        clientId: data.clientId,
        projectId: data.projectId || undefined,
        description: data.description,
        date: data.date.toISOString(),
      },
    });
    // Not part of the outbox/sync flow (finish() is a normal authenticated
    // call, not a local-first event) — clear the local mirror directly so
    // the widget goes back to IDLE instead of re-showing this form.
    await reset();
    onSuccess();
  };

  const handleDiscardConfirmed = async () => {
    await discard();
    setDiscardOpen(false);
  };

  if (!isOnline) {
    return (
      <Card
        data-testid="work-session-finish-form-offline"
        className="fixed bottom-4 right-4 z-50 w-96 border-green-200 dark:border-green-800"
      >
        <CardContent className="p-4 text-sm text-muted-foreground">
          {t("offlineNotice")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid="work-session-finish-form"
      className="fixed bottom-4 right-4 z-50 w-96 border-green-200 dark:border-green-800"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t("title", { duration: formatHours(session.hours) })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("dateLabel")}</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePickerComponent
                  value={field.value}
                  onChange={(date) => date && field.onChange(date)}
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
            <Button
              type="submit"
              disabled={finishMutation.isPending}
              className="flex-1"
            >
              {finishMutation.isPending ? t("saving") : t("save")}
            </Button>

            <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  data-testid="discard-trigger"
                >
                  {t("discard")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("discardDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="discard-confirm"
                    onClick={handleDiscardConfirmed}
                  >
                    {t("discard")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
