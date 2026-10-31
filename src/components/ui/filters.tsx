"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Popover } from "./popover";

export function SegmentedControl<T extends string>({
  options, value, onChange, label,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="scroll-thin inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
            o.value === value ? "bg-surface text-ink shadow-card" : "text-mute hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  value, onChange, placeholder, label, className,
}: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
      />
    </div>
  );
}

export function FilterSelect<T extends string>({
  label, value, options, onChange, allLabel = "All",
}: { label: string; value: T | "all"; options: T[]; onChange: (v: T | "all") => void; allLabel?: string }) {
  const entries: (T | "all")[] = ["all", ...options];
  return (
    <Popover
      label={`Filter by ${label}`}
      role="menu"
      align="start"
      panelClassName="w-52 p-1.5"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong"
        >
          <span className="text-mute">{label}</span>
          <span className="font-medium">{value === "all" ? allLabel : value}</span>
          <ChevronDown className="size-4 text-faint" aria-hidden />
        </button>
      )}
    >
      {(close) =>
        entries.map((o) => (
          <button
            key={o}
            type="button"
            role="menuitemradio"
            aria-checked={o === value}
            onClick={() => {
              onChange(o);
              close();
            }}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised"
          >
            {o === "all" ? allLabel : o}
            {o === value && <Check className="size-4 text-gold" aria-hidden />}
          </button>
        ))
      }
    </Popover>
  );
}
