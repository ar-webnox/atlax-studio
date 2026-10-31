"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TriggerProps = {
  id: string;
  "aria-expanded": boolean;
  "aria-haspopup": "menu" | "dialog";
  "aria-controls": string | undefined;
  onClick: () => void;
};

type PopoverProps = {
  trigger: (props: TriggerProps) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  role?: "menu" | "dialog";
  label: string;
  className?: string;
  panelClassName?: string;
  /** On small screens, pin the panel to the viewport edges so it never overflows. */
  sheetOnMobile?: boolean;
};

export function Popover({ trigger, children, align = "end", role = "dialog", label, className, panelClassName, sheetOnMobile }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        rootRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && role === "menu") panelRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
  }, [open, role]);

  const onPanelKey = (e: KeyboardEvent) => {
    if (role !== "menu" || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? []);
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger({
        id: `${uid}-trigger`,
        "aria-expanded": open,
        "aria-haspopup": role,
        "aria-controls": open ? `${uid}-panel` : undefined,
        onClick: () => setOpen((o) => !o),
      })}
      {open && (
        <div
          ref={panelRef}
          id={`${uid}-panel`}
          role={role}
          aria-label={label}
          onKeyDown={onPanelKey}
          className={cn(
            "animate-pop absolute top-full z-40 mt-2 max-w-[calc(100vw-1.5rem)] rounded-xl border border-line bg-surface shadow-pop",
            align === "end" ? "right-0" : "left-0",
            sheetOnMobile && "max-sm:fixed max-sm:inset-x-3 max-sm:top-[4.25rem] max-sm:mt-0 max-sm:max-w-none",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
