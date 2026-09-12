import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BigStatsDisplaySkeleton, SkeletonBox } from "@/components/layout/loading-skeleton";

export function InvoicesPageSkeleton() {
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

      {/* Big Stats Display */}
      <BigStatsDisplaySkeleton />

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
