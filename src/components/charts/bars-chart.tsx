"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartFrame, ChartTooltip, gridStroke, type TooltipLike } from "./shared";

export type BarSeries = { key: string; label: string; color: string };

export function BarsChart({
  data, xKey, series, stacked, height = 260, format = (n) => String(n), label, layout = "horizontal",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: BarSeries[];
  stacked?: boolean;
  height?: number;
  format?: (n: number) => string;
  label: string;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ChartFrame height={height} label={label}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={format} />
              <YAxis type="category" dataKey={xKey} tick={axisTick} tickLine={false} axisLine={false} width={92} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={format} />
            </>
          )}
          <Tooltip cursor={{ fill: "var(--raised)", opacity: 0.6 }} content={(p) => <ChartTooltip {...(p as unknown as TooltipLike)} format={format} />} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              stackId={stacked ? "a" : undefined}
              radius={stacked ? 0 : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
