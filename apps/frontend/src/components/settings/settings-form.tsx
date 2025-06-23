"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, Mail, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/services/settings";
import { useTranslations } from "next-intl";

const settingsSchema = z.object({
  alertHours: z
    .number()
    .min(1, "Alert hours must be at least 1")
    .max(1000, "Alert hours must be at most 1000"),
  notificationEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      alertHours: 160,
      notificationEmail: "",
    },
  });

  const { data: settings, isLoading, error } = useSettings();

  // Update form when settings data is loaded
  useEffect(() => {
    if (settings) {
      reset({
        alertHours: settings.alertHours,
        notificationEmail: settings.notificationEmail || "",
      });
    }
  }, [settings, reset]);

  const updateMutation = useUpdateSettings();

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);

    updateMutation.mutate(
      {
        alertHours: data.alertHours,
        notificationEmail: data.notificationEmail || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("settingsUpdatedSuccessfully"));
          setIsSubmitting(false);
        },
        onError: (error: any) => {
          console.error("Error updating settings:", error);
          toast.error(
            error.response?.data?.message || t("failedToUpdateSettings")
          );
          setIsSubmitting(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>{t("loadingSettings")}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error loading settings:", error);
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{t("failedToLoad")}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("notificationSettings")}
          </CardTitle>
          <CardDescription>
            {t("notificationSettingsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alertHours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("alertHoursThreshold")}
              </Label>
              <Input
                id="alertHours"
                type="number"
                min="1"
                max="1000"
                step="1"
                placeholder="160"
                {...register("alertHours", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.alertHours && (
                <p className="text-sm text-destructive">
                  {errors.alertHours.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t("alertHoursDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notificationEmail"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {t("notificationEmail")}
              </Label>
              <Input
                id="notificationEmail"
                type="email"
                placeholder="your-email@example.com"
                {...register("notificationEmail")}
                disabled={isSubmitting}
              />
              {errors.notificationEmail && (
                <p className="text-sm text-destructive">
                  {errors.notificationEmail.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t("notificationEmailOptional")}
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("save")}
                  </>
                )}
              </Button>
              {isDirty && !isSubmitting && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t("unsavedChanges")}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{t("automaticMonitoring")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("automaticMonitoringDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{t("emailNotifications")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("emailNotificationsDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
