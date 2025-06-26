"use client";

import { format } from "date-fns";
import { Clock, FileText, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivity } from "@/services/admin";

// Tipos específicos para activity baseados no retorno da API
interface ActivityWorkHour {
  id: string;
  date: string;
  hours: number;
  description: string;
  user?: { name: string };
  client: { name: string; company?: string };
  project?: { name: string };
  createdAt?: string;
}

interface ActivityInvoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  client: { name: string; company?: string };
  createdAt: string;
}

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminActivity() {
  const { data: activity, isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Work Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity?.workHours.slice(0, 10).map((entry: ActivityWorkHour) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {entry.user?.name} - {entry.hours}h
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.client?.company || entry.client?.name}{" "}
                    {entry.project && `• ${entry.project.name}`}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.createdAt &&
                    format(new Date(entry.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity?.invoices.slice(0, 10).map((invoice: ActivityInvoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Invoice #{invoice.number || invoice.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.client?.company || invoice.client?.name} • $
                    {invoice.amount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      invoice.status === "PAID"
                        ? "default"
                        : invoice.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {invoice.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(invoice.createdAt), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            New Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity?.newUsers.map((user: ActivityUser) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
