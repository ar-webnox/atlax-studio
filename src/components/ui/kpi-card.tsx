import { ArrowDownRight, ArrowUpRight, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/charts/sparkline";
import { Card } from "./card";
import { Tooltip } from "./tooltip";

export function KpiCard({
  label, value, delta, deltaSuffix = "%", comparison = "vs previous period", series, icon: Icon, hint, lowerIsBetter,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  comparison?: string;
  series?: number[];
  icon?: LucideIcon;
  hint?: string;
  /** When true, a decrease is good news (latency, errors, cycle time). */
  lowerIsBetter?: boolean;
}) {
  const rising = delta >= 0;
  const positive = lowerIsBetter ? delta <= 0 : delta >= 0;
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-mute">
          {Icon && <Icon className="size-4 text-faint" aria-hidden />}
          <span>{label}</span>
          {hint && (
            <Tooltip content={hint}>
              <button type="button" aria-label={`About ${label}`} className="text-faint hover:text-ink">
                <Info className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="font-display text-[28px] font-semibold leading-none tracking-tight tabular text-ink">{value}</p>
        {series && (
          <div className="w-24 shrink-0">
            <Sparkline values={series} color={positive ? "var(--pos)" : "var(--neg)"} />
          </div>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-mute">
        <span className={cn("inline-flex items-center gap-0.5 font-medium tabular", positive ? "text-pos" : "text-neg")}>
          {rising ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
          {Math.abs(delta)}
          {deltaSuffix}
        </span>
        <span>{comparison}</span>
      </p>
    </Card>
  );
}
