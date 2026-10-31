"use client";

import { useId, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type TabOption<T extends string> = { value: T; label: string; count?: number };

export function Tabs<T extends string>({
  options, value, onChange, label, className,
}: { options: TabOption<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const uid = useId();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const idx = options.findIndex((o) => o.value === value);
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    document.getElementById(`${uid}-${options[next].value}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} className={cn("scroll-thin flex gap-1 overflow-x-auto border-b border-line", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            id={`${uid}-${o.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              selected ? "border-gold text-ink" : "border-transparent text-mute hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className="rounded-md bg-sunken px-1.5 text-xs font-medium tabular text-mute">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
