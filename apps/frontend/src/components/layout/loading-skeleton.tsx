import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?: "card" | "stats" | "table" | "list";
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

export function LoadingSkeleton({
  type = "card",
  count = 4,
  className,
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
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

  return (
    <div className={cn("container mx-auto py-6", className)}>
      <div className="space-y-6">{renderSkeleton()}</div>
    </div>
  );
}
