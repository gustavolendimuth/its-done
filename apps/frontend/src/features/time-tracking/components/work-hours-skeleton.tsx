import { BigStatsDisplaySkeleton, SkeletonBox } from "@/components/layout/loading-skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export function WorkHoursSkeleton() {
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

      {/* Big Stats Display */}
      <BigStatsDisplaySkeleton />

      {/* Work Hours List */}
      <div className="space-y-4">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-10 w-full max-w-xs" />
        <div className="border rounded-lg overflow-hidden">
          <div className="border-b p-3 bg-muted/30">
            <div className="flex gap-4">
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-4 w-16" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b last:border-b-0 p-3">
              <div className="flex gap-4 items-center">
                <SkeletonBox className="h-4 flex-1" />
                <SkeletonBox className="h-4 flex-1" />
                <SkeletonBox className="h-4 flex-1" />
                <SkeletonBox className="h-4 w-16" />
                <SkeletonBox className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
