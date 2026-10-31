"use client";

import { cloneElement, isValidElement, useId, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

type Side = "top" | "right" | "bottom";

export function Tooltip({ content, side = "top", children }: { content: string; side?: Side; children: ReactElement<Record<string, unknown>> }) {
  const id = useId();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    if (side === "right") setPos({ x: r.right + 8, y: r.top + r.height / 2 });
    else if (side === "bottom") setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
    else setPos({ x: r.left + r.width / 2, y: r.top - 8 });
  };
  const hide = () => setPos(null);

  if (!isValidElement(children)) return children;
  const transform = side === "right" ? "translate(0,-50%)" : side === "bottom" ? "translate(-50%,0)" : "translate(-50%,-100%)";

  return (
    <>
      {cloneElement(children, {
        "aria-describedby": pos ? id : undefined,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget),
        onMouseLeave: hide,
        onFocus: (e: React.FocusEvent<HTMLElement>) => show(e.currentTarget),
        onBlur: hide,
      })}
      {pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ left: pos.x, top: pos.y, transform }}
            className="pointer-events-none fixed z-[70] max-w-[240px] rounded-md border border-line-strong bg-raised px-2 py-1 text-xs font-medium text-ink shadow-pop"
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
