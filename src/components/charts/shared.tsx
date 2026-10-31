"use client";

import type { ReactNode } from "react";

export type TooltipLike = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string | number; value?: number | string; color?: string; dataKey?: string | number }[];
};

export function ChartTooltip({ active, label, payload, format }: TooltipLike & { format?: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border border-line-strong bg-raised px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1.5 font-medium text-ink">{label}</p>}
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-mute">
              <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
              {p.name}
            </span>
            <span className="tabular font-medium text-ink">{typeof p.value === "number" && format ? format(p.value) : p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const axisTick = { fill: "var(--faint)", fontSize: 12 };
export const gridStroke = "var(--line)";

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-mute" aria-label="Chart legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartFrame({ height, children, label }: { height: number; children: ReactNode; label: string }) {
  return (
    <div style={{ height }} className="min-w-0" role="img" aria-label={label}>
      {children}
    </div>
  );
}

/** Legend whose entries toggle series visibility. */
export function LegendToggle({ items, hidden, onToggle }: { items: { key: string; label: string; color: string }[]; hidden: string[]; onToggle: (key: string) => void }) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Chart series (select to show or hide)">
      {items.map((i) => {
        const off = hidden.includes(i.key);
        return (
          <li key={i.key}>
            <button type="button" aria-pressed={!off} onClick={() => onToggle(i.key)}
              className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[13px] transition-colors ${off ? "border-line text-faint line-through" : "border-line-strong text-ink hover:bg-raised"}`}>
              <span className="size-2.5 rounded-sm" style={{ background: off ? "var(--line-strong)" : i.color }} aria-hidden />
              {i.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
