import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "./card";
import { ChartSkeleton } from "./skeleton";
import { Legend } from "@/components/charts/shared";

export function ChartContainer({
  title, description, actions, legend, loading, skeletonHeight = 260, children, className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  legend?: { label: string; color: string }[] | ReactNode;
  loading?: boolean;
  skeletonHeight?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title={title} description={description} action={actions} />
      <CardBody className="flex-1 pt-4">
        {legend && <div className="mb-4">{Array.isArray(legend) ? <Legend items={legend as { label: string; color: string }[]} /> : legend}</div>}
        {loading ? <ChartSkeleton height={skeletonHeight} /> : children}
      </CardBody>
    </Card>
  );
}
