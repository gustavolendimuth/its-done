import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import {
  Clock,
  User,
  Calendar,
  Building2,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
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
import { useTranslations } from "next-intl";
import { formatTimeAgo } from "@/lib/utils";

/**
 * WorkHourCard Component
 *
 * A professional card component for displaying work hour entries with optimized layout.
 * Features integrated design with no redundant information and highlighted company names.
 *
 * @param workHour - Work hour data object
 * @param onEdit - Callback function when edit button is clicked
 * @param onDelete - Callback function when delete button is clicked
 * @param isDeleting - Boolean to show loading state during deletion
 * @param className - Additional CSS classes
 *
 * @example
 * <WorkHourCard workHour={data} onEdit={handleEdit} onDelete={handleDelete} />
 */
export interface WorkHourCardProps {
  workHour: {
    id: string;
    date: string | Date;
    description?: string;
    hours: number;
    client?: {
      id: string;
      name?: string;
      company: string;
      email: string;
    };
    project?: {
      id: string;
      name: string;
    };
    createdAt: string | Date;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  className?: string;
}

export function WorkHourCard({
  workHour,
  onEdit,
  onDelete,
  isDeleting = false,
  className,
}: WorkHourCardProps) {
  const t = useTranslations("workHours");
  const tCommon = useTranslations("common");

  const client = workHour.client;
  const clientDisplayName =
    client?.name && client.company
      ? `${client.company} (${client.name})`
      : (client?.company ?? t("noClient"));

  const workDate = new Date(workHour.date);
  const createdDate = new Date(workHour.createdAt);

  const formatHoursToHHMM = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className="group transition-all duration-200 hover:scale-[1.02] space-y-0 h-full flex flex-col">
      <Card
        className={cn(
          "overflow-hidden relative hover:shadow-lg rounded-b-none flex-1",
          "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800",
          className
        )}
      >
        {/* Accent bar */}
        <div className="h-2 bg-green-500" />

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Work Hour Icon */}
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-green-500 flex-shrink-0">
              <Clock className="h-6 w-6" />
            </div>

            {/* Work Hour Info */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* First Line: Hours + Date */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold truncate">
                  {formatHoursToHHMM(workHour.hours)}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {tCommon("on")} {format(workDate, "dd/MM/yyyy")}
                </span>
              </div>

              {/* Second Line: Only Worked Time */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatTimeAgo(workDate, tCommon)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company and Stats Section - Aligned with Description */}
          <div className="space-y-3">
            {/* Company Name (highlighted) */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-foreground bg-green-50/70 dark:bg-green-900/20 px-2 py-1 rounded-md truncate border border-green-200/50 dark:border-green-800/50">
                {workHour.client?.company ?? t("noClient")}
              </p>
            </div>

            {/* Project (if exists) */}
            {workHour.project && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">
                  {workHour.project.name}
                </p>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t("created")} {format(createdDate, "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          {/* Description */}
          {workHour.description && (
            <div className="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-3">
              <p className="text-sm text-foreground italic">
                "{workHour.description}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons - Always Visible */}
      <div className="border border-t-0 rounded-t-none rounded-b-lg bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800 group-hover:shadow-lg">
        <div className="p-3 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onEdit(workHour.id)}
            >
              <Edit className="w-3 h-3 mr-1" />
              {t("edit")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {isDeleting ? t("deleting") : t("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("deleteWorkHourTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteWorkHourDescription", {
                      hours: formatHoursToHHMM(workHour.hours),
                      client: clientDisplayName,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(workHour.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("deleteEntry")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
