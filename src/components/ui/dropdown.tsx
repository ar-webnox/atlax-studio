"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Popover, type TriggerProps } from "./popover";

export type MenuEntry =
  | { type?: "item"; label: string; icon?: LucideIcon; onSelect?: () => void; href?: string; danger?: boolean; hint?: string }
  | { type: "separator" };

const itemClass =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none transition-colors hover:bg-raised focus-visible:bg-raised";

export function MenuItem({
  label, icon: Icon, onSelect, href, danger, hint, close,
}: Extract<MenuEntry, { label: string }> & { close?: () => void }) {
  const content = (
    <>
      {Icon && <Icon className={cn("size-4 shrink-0", danger ? "text-neg" : "text-faint")} aria-hidden />}
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </>
  );
  const cls = cn(itemClass, danger && "text-neg");
  if (href) {
    return (
      <Link href={href} role="menuitem" className={cls} onClick={close}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      className={cls}
      onClick={() => {
        close?.();
        onSelect?.();
      }}
    >
      {content}
    </button>
  );
}

export function DropdownMenu({
  trigger, entries, align = "end", label, width = "w-56",
}: { trigger: (p: TriggerProps) => React.ReactNode; entries: MenuEntry[]; align?: "start" | "end"; label: string; width?: string }) {
  return (
    <Popover trigger={trigger} align={align} role="menu" label={label} panelClassName={cn("p-1.5", width)}>
      {(close) =>
        entries.map((entry, i) =>
          entry.type === "separator" ? (
            <div key={i} role="separator" className="my-1.5 h-px bg-line" />
          ) : (
            <MenuItem key={entry.label} {...entry} close={close} />
          ),
        )
      }
    </Popover>
  );
}
