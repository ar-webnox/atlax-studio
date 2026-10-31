"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame, ChartTooltip, type TooltipLike } from "./shared";

export type Slice = { name: string; value: number; color: string };

export function DonutChart({
  data, height = 200, centerLabel, centerValue, label, format = (n) => String(n),
}: { data: Slice[]; height?: number; centerLabel: string; centerValue: string; label: string; format?: (n: number) => string }) {
  return (
    <div className="relative">
      <ChartFrame height={height} label={label}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={(p) => <ChartTooltip {...(p as unknown as TooltipLike)} format={format} />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold tabular text-ink">{centerValue}</span>
        <span className="text-xs text-mute">{centerLabel}</span>
      </div>
    </div>
  );
}
