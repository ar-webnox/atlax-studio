import { cn } from "@/lib/cn";
import { Card } from "./card";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("rounded-md bg-sunken motion-safe:animate-pulse", className)} />;
}

export function KpiSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-4 h-3 w-40" />
    </Card>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }} role="status" aria-label="Loading chart">
      {[40, 62, 48, 75, 58, 82, 66, 90, 72, 84, 60, 78].map((h, i) => (
        <Skeleton key={i} className="flex-1" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/3" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
