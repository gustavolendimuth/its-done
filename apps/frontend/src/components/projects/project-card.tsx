"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Folder,
  Building2,
  Calendar,
  Clock,
  FileText,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    clientId: string;
    client: {
      company: string;
    };
    _count: {
      workHours: number;
    };
  };
  onDelete: (projectId: string) => void;
  isDeleting?: boolean;
}

export function ProjectCard({
  project,
  onDelete,
  isDeleting = false,
}: ProjectCardProps) {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleViewClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/clients/${project.clientId}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implementar modal de edição de projeto
    console.log("Edit project:", project.id);
  };

  const handleDelete = () => {
    onDelete(project.id);
    setIsAlertOpen(false);
  };

  // Prepare contact info
  const contactInfo = [
    { icon: Building2, value: project.client.company },
    {
      icon: Calendar,
      value: `Created ${formatDistanceToNow(new Date(project.createdAt))} ago`,
    },
  ];

  // Prepare stats
  const cardStats = [
    {
      icon: FileText,
      label: "Entries",
      value: project._count.workHours.toString(),
    },
    {
      icon: Calendar,
      label: "Created",
      value: formatDistanceToNow(new Date(project.createdAt), {
        addSuffix: true,
      }),
    },
    {
      icon: Clock,
      label: "Status",
      value: "Active",
    },
  ];

  return (
    <div className="group transition-all duration-200 hover:scale-[1.02] space-y-0">
      <Card
        className={cn(
          "overflow-hidden relative hover:shadow-lg rounded-b-none",
          "bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800"
        )}
      >
        {/* Accent bar */}
        <div className="h-2 bg-indigo-500" />

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-indigo-500">
              <Folder className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold truncate">{project.name}</h3>
              <Badge variant="info" className="mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {project._count.workHours} entries
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {project.description && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">{project.description}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <info.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{info.value}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid gap-4 pt-4 border-t grid-cols-3">
            {cardStats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Always Visible */}
      <div className="border border-t-0 rounded-t-none rounded-b-lg bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 group-hover:shadow-lg">
        <div className="p-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewClient}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Client
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
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
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the project "{project.name}
                    "? This action cannot be undone and will remove all
                    associated work hours.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Project
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
