import { BigStatsDisplaySkeleton, SkeletonBox } from "@/components/layout/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ClientsPageSkeleton() {
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

      {/* Big Stats Display */}
      <BigStatsDisplaySkeleton />

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
