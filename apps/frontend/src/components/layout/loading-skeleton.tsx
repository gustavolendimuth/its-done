import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?:
    | "card"
    | "stats"
    | "table"
    | "list"
    | "work-hours"
    | "clients-page"
    | "projects-page"
    | "invoices-page"
    | "analytics-page";
  count?: number;
  className?: string;
}

function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded", className)} />;
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <SkeletonBox className="h-8 w-16 mb-2" />
        <SkeletonBox className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-32" />
        <SkeletonBox className="h-8 w-24" />
      </div>
      <div className="border rounded-lg">
        <div className="border-b p-4">
          <div className="flex gap-4">
            <SkeletonBox className="h-4 flex-1" />
            <SkeletonBox className="h-4 flex-1" />
            <SkeletonBox className="h-4 flex-1" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b last:border-b-0 p-4">
            <div className="flex gap-4">
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-5 w-3/4" />
                <SkeletonBox className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton específico para Work Hours page
function WorkHoursSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8" />
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-32" />
            <SkeletonBox className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-6 w-6" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-48" />
              <SkeletonBox className="h-4 w-96" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-11 w-full" />
        </div>
        <div className="space-y-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-11 w-full" />
        </div>
      </div>

      {/* Total Hours Display - Big Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-32" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <SkeletonBox className="h-16 w-32 mx-auto mb-2" />
            <SkeletonBox className="h-4 w-48 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-2">
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-6 w-16" />
                <SkeletonBox className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Hours List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-4 w-20" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonBox className="h-5 w-32" />
                  <SkeletonBox className="h-4 w-48" />
                </div>
                <div className="text-right space-y-1">
                  <SkeletonBox className="h-5 w-16" />
                  <SkeletonBox className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton específico para Clients page
function ClientsPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8" />
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-24" />
            <SkeletonBox className="h-4 w-56" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-6 w-6" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-56" />
              <SkeletonBox className="h-4 w-80" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Search Bar */}
      <SkeletonBox className="h-11 w-full" />

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-5 w-3/4" />
                  <SkeletonBox className="h-4 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center space-y-1">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-3 w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <SkeletonBox className="h-8 flex-1" />
                <SkeletonBox className="h-8 flex-1" />
                <SkeletonBox className="h-8 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton específico para Projects page
function ProjectsPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8" />
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-28" />
            <SkeletonBox className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-6 w-6" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-48" />
              <SkeletonBox className="h-4 w-96" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter and Count */}
      <div className="flex gap-4 items-center">
        <SkeletonBox className="h-11 w-64" />
        <SkeletonBox className="h-4 w-20 ml-auto" />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-5 w-3/4" />
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-4 w-4" />
                    <SkeletonBox className="h-4 w-24" />
                  </div>
                </div>
                <SkeletonBox className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-2/3" />
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-3 w-3" />
                <SkeletonBox className="h-3 w-32" />
              </div>
              <div className="flex gap-2 pt-2">
                <SkeletonBox className="h-8 flex-1" />
                <SkeletonBox className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton específico para Invoices page
function InvoicesPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8" />
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-28" />
            <SkeletonBox className="h-4 w-72" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-6 w-6" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-56" />
              <SkeletonBox className="h-4 w-80" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <SkeletonBox className="h-11 flex-1" />
            <SkeletonBox className="h-11 w-32" />
            <SkeletonBox className="h-11 w-32" />
          </div>
          <div className="flex justify-between items-center mt-4">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonBox className="h-5 w-24" />
                  <SkeletonBox className="h-4 w-32" />
                </div>
                <SkeletonBox className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <SkeletonBox className="h-8 w-20" />
                <SkeletonBox className="h-4 w-28" />
              </div>
              <div className="flex gap-2">
                <SkeletonBox className="h-8 flex-1" />
                <SkeletonBox className="h-8 w-8" />
                <SkeletonBox className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton específico para Analytics page
function AnalyticsPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-8 w-8" />
            <div className="space-y-1">
              <SkeletonBox className="h-8 w-40" />
              <SkeletonBox className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="h-10 w-20" />
            <SkeletonBox className="h-10 w-20" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-6 w-6" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-64" />
              <SkeletonBox className="h-4 w-96" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="space-y-6">
        <SkeletonBox className="h-11 w-full max-w-md" />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <SkeletonBox className="h-6 w-40" />
              <SkeletonBox className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <SkeletonBox className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SkeletonBox className="h-6 w-32" />
              <SkeletonBox className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <SkeletonBox className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <SkeletonBox className="h-6 w-40" />
              <SkeletonBox className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBox className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <SkeletonBox className="h-4 w-3/4" />
                      <SkeletonBox className="h-3 w-1/2" />
                    </div>
                    <SkeletonBox className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SkeletonBox className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SkeletonBox className="h-16 w-16 rounded-full mx-auto" />
                <div className="text-center space-y-2">
                  <SkeletonBox className="h-8 w-20 mx-auto" />
                  <SkeletonBox className="h-4 w-24 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  type = "card",
  count = 4,
  className,
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case "work-hours":
        return <WorkHoursSkeleton />;
      case "clients-page":
        return <ClientsPageSkeleton />;
      case "projects-page":
        return <ProjectsPageSkeleton />;
      case "invoices-page":
        return <InvoicesPageSkeleton />;
      case "analytics-page":
        return <AnalyticsPageSkeleton />;
      case "stats":
        return <StatsSkeleton />;
      case "table":
        return <TableSkeleton />;
      case "list":
        return <ListSkeleton count={count} />;
      case "card":
      default:
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        );
    }
  };

  // Para skeletons específicos de página, não usar o wrapper container
  if (
    [
      "work-hours",
      "clients-page",
      "projects-page",
      "invoices-page",
      "analytics-page",
    ].includes(type)
  ) {
    return renderSkeleton();
  }

  return (
    <div className={cn("container mx-auto py-6", className)}>
      <div className="space-y-6">{renderSkeleton()}</div>
    </div>
  );
}
