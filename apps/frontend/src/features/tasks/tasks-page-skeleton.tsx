import { SkeletonBox } from "@/components/layout/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TasksPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8" />
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-28" />
            <SkeletonBox className="h-4 w-64" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <SkeletonBox className="h-11 w-64" />
        <SkeletonBox className="h-4 w-20 ml-auto" />
      </div>

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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonBox className="h-4 w-full" />
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
