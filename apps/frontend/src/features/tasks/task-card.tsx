"use client";

import {
  ListChecks,
  Building2,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  Folder,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { TaskEditDialog } from "./task-edit-dialog";

import type { Task } from "./tasks.service";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  isDeleting?: boolean;
}

export function TaskCard({ task, onDelete, isDeleting = false }: TaskCardProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    onDelete(task.id);
    setIsAlertOpen(false);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.link) {
      window.open(task.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="group transition-all duration-200 hover:scale-[1.02] space-y-0 h-full flex flex-col">
      <Card
        className={cn(
          "overflow-hidden relative hover:shadow-lg rounded-b-none flex-1",
          "bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/20 border-teal-200 dark:border-teal-800"
        )}
      >
        <div className="h-2 bg-teal-500" />

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-teal-500">
              <ListChecks className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold truncate">{task.title}</h3>
              {task.project && (
                <Badge variant="info" className="mt-1">
                  <Folder className="h-3 w-3 mr-1" />
                  {task.project.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{task.client.company}</span>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t grid-cols-2">
            <div className="flex flex-col items-center text-center">
              <Clock className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("totalHours")}
              </p>
              <p className="text-sm font-bold">
                {(task.totalHours ?? 0).toFixed(2)}h
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ExternalLink className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("link")}
              </p>
              <p className="text-sm font-bold">
                {task.link ? t("yes") : t("none")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border border-t-0 rounded-t-none rounded-b-lg bg-teal-50/50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 group-hover:shadow-lg">
        <div className="p-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleOpenLink}
              disabled={!task.link}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {t("open")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {t("edit")}
            </Button>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteTask")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteTaskDescription", { title: task.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("deleteTask")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {showEditDialog && (
        <TaskEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          task={task}
          onSuccess={() => {
            setShowEditDialog(false);
            toast.success(t("saveSuccess"));
          }}
        />
      )}
    </div>
  );
}
