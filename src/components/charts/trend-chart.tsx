"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartFrame, ChartTooltip, gridStroke, type TooltipLike } from "./shared";

export type TrendSeries = { key: string; label: string; color: string; filled?: boolean; dashed?: boolean };

export function TrendChart({
  data, xKey, series, height = 280, format = (n) => String(n), label,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  format?: (n: number) => string;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <ChartFrame height={height} label={label}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} tickMargin={10} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} tickFormatter={format} />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)" }}
            content={(p) => <ChartTooltip {...(p as unknown as TooltipLike)} format={format} />}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.filled ? 2 : 1.5}
              strokeDasharray={s.dashed ? "5 5" : undefined}
              fill={s.filled ? `url(#${uid}-${s.key})` : "transparent"}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
