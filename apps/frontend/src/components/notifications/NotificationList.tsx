"use client";

import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useUnreadNotifications,
  type Notification,
  type NotificationType,
} from "@/services/notifications";

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  INFO: <Info className="h-4 w-4 text-blue-500" />,
  SUCCESS: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
};

const notificationColors: Record<NotificationType, string> = {
  INFO: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
  SUCCESS: "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800",
  WARNING: "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  ERROR: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800",
};

export function NotificationList() {
  const t = useTranslations();
  const { data: notifications = [], isLoading } = useUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      toast.error(t("notifications.errorMarkingAsRead"));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success(t("notifications.allMarkedAsRead"));
    } catch (error) {
      toast.error(t("notifications.errorMarkingAllAsRead"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success(t("notifications.deleted"));
    } catch (error) {
      toast.error(t("notifications.errorDeleting"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          {t("notifications.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">{t("notifications.title")}</h3>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {t("notifications.markAllAsRead")}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("notifications.noNotifications")}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const t = useTranslations();
  const invoiceId = notification.metadata?.invoiceId as string | undefined;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all hover:shadow-sm group",
        notificationColors[notification.type]
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {notificationIcons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm break-words flex-1">
              {notification.title}
            </h4>
            <button
              onClick={() => onDelete(notification.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          {invoiceId && (
            <Link
              href={`/invoices?id=${invoiceId}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
              {t("notifications.viewInvoice")}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(new Date(notification.createdAt), t)}
            </span>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="h-6 text-xs flex-shrink-0"
              >
                {t("notifications.markAsRead")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
