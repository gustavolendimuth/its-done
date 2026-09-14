import { BigStatsDisplaySkeleton, SkeletonBox } from "@/components/layout/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AnalyticsPageSkeleton() {
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

        {/* Big Stats Display */}
        <BigStatsDisplaySkeleton />

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
