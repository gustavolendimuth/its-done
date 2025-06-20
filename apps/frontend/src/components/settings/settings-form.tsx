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

const settingsSchema = z.object({
  alertHours: z
    .number()
    .min(1, "Alert hours must be at least 1")
    .max(1000, "Alert hours must be less than 1000"),
  notificationEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsForm() {
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
          toast.success("Settings updated successfully!");
          setIsSubmitting(false);
        },
        onError: (error: any) => {
          console.error("Error updating settings:", error);
          toast.error(
            error.response?.data?.message || "Failed to update settings"
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
          <span>Loading settings...</span>
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
            <AlertDescription>
              Failed to load settings. Please try again later.
            </AlertDescription>
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
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure when you want to receive email notifications about your
            work hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alertHours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Alert Hours Threshold
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
                You'll receive an email notification when your total work hours
                reach this threshold.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notificationEmail"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Notification Email
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
                Leave empty to use your account email, or specify a different
                email for notifications.
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
              {isDirty && !isSubmitting && (
                <p className="text-sm text-muted-foreground mt-2">
                  You have unsaved changes.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Automatic Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                We automatically track your total work hours and check against
                your threshold.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                When you reach your threshold, we'll send you an email
                notification so you can create invoices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
