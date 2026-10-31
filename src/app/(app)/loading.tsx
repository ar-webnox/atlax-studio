import { Card } from "@/components/ui/card";
import { ChartSkeleton, KpiSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2"><ChartSkeleton height={280} /></Card>
        <Card><TableSkeleton rows={6} cols={2} /></Card>
      </div>
    </div>
  );
}
