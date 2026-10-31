"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";

export function Sparkline({ values, color = "var(--gold)", height = 36 }: { values: number[]; color?: string; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="min-w-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${uid})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
