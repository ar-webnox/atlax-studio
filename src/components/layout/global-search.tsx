"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { filterEntries, useSearchIndex } from "./search-index";
import { useShell } from "./shell-context";

export function GlobalSearch() {
  const router = useRouter();
  const { setCommandOpen } = useShell();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const index = useSearchIndex();
  const results = filterEntries(index, query);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) go(results[active].href);
    else if (e.key === "Escape") setOpen(false);
  };

  const showList = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input
        id="global-search"
        type="text"
        role="combobox"
        aria-label="Search workspace"
        aria-expanded={showList}
        aria-controls={`${uid}-list`}
        aria-activedescendant={showList && results[active] ? `${uid}-${results[active].id}` : undefined}
        autoComplete="off"
        value={query}
        placeholder="Search pages, people, reports, accounts"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        className="h-9 w-full rounded-lg border border-line bg-raised pl-9 pr-16 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
      />
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Open command menu"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-mute hover:text-ink"
      >
        Ctrl K
      </button>
      {showList && (
        <ul id={`${uid}-list`} role="listbox" aria-label="Search results" className="animate-pop absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-mute">No results for &ldquo;{query}&rdquo;. Try a project, person or report name.</li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.id}
                id={`${uid}-${r.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2", i === active && "bg-raised")}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{r.label}</span>
                  <span className="block truncate text-xs text-mute">{r.detail}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-md border border-line px-1.5 py-0.5 text-xs text-mute">{r.kind}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
