"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CornerDownLeft, FilePlus2, FolderPlus, Keyboard, Moon, RotateCcw, Search, Share2, UserPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { allNavItems } from "@/lib/nav";
import { routePermission, type Permission } from "@/lib/rbac";
import { resetAllStores } from "@/lib/store";
import { setIntent } from "@/lib/state/intent";
import { useCan } from "@/components/rbac";
import { useShell } from "./shell-context";
import { filterEntries, useSearchIndex } from "./search-index";

type Command = { id: string; label: string; group: string; icon: LucideIcon; run: () => void; permission?: Permission };

export function CommandMenu() {
  const { commandOpen, setCommandOpen, setShortcutsOpen } = useShell();
  const router = useRouter();
  const can = useCan();
  const index = useSearchIndex();
  const { resolvedTheme, setTheme } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const go = (intent: string, href: string) => () => { setIntent(intent); router.push(href); };
    return [
      { id: "new-report", label: "Create a report", group: "Actions", icon: FilePlus2, permission: "reports:create", run: go("new-report", "/reports") },
      { id: "invite", label: "Invite a teammate", group: "Actions", icon: UserPlus, permission: "team:create", run: go("invite", "/team") },
      { id: "new-project", label: "Create a project", group: "Actions", icon: FolderPlus, permission: "projects:create", run: go("new-project", "/projects") },
      { id: "save-view", label: "Save a view of Analytics", group: "Actions", icon: Share2, permission: "dashboards:create", run: go("save-view", "/analytics") },
      { id: "theme", label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme", group: "Actions", icon: Moon, run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark") },
      { id: "shortcuts", label: "Show keyboard shortcuts", group: "Actions", icon: Keyboard, run: () => setShortcutsOpen(true) },
      { id: "reset", label: "Reset demo data in this browser", group: "Actions", icon: RotateCcw, run: () => { resetAllStores(); window.location.assign("/overview"); } },
      ...allNavItems.filter((i) => { const p = routePermission(i.href); return !p || can(p); }).map((i) => ({ id: i.href, label: `Go to ${i.label}`, group: "Navigation", icon: i.icon, run: () => router.push(i.href) })),
    ];
  }, [router, resolvedTheme, setTheme, setShortcutsOpen, can]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const cmds = commands.filter((c) => (!c.permission || can(c.permission)) && c.label.toLowerCase().includes(q));
    const hits: Command[] = q.length >= 2
      ? filterEntries(index, q, 6).filter((e) => e.kind !== "Page").map((e) => ({ id: e.id, label: e.label, group: "Results", icon: Search, run: () => router.push(e.href) }))
      : [];
    return [...cmds, ...hits];
  }, [commands, q, index, can, router]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (commandOpen && !d.open) { d.showModal(); setQuery(""); setActive(0); }
    if (!commandOpen && d.open) d.close();
  }, [commandOpen]);

  const run = (c: Command) => { setCommandOpen(false); c.run(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && filtered[active]) run(filtered[active]);
  };

  useEffect(() => { document.getElementById(`cmd-${filtered[active]?.id}`)?.scrollIntoView({ block: "nearest" }); }, [active, filtered]);

  let lastGroup = "";
  return (
    <dialog ref={dialogRef} aria-label="Command menu" onClose={() => setCommandOpen(false)} onClick={(e) => e.target === dialogRef.current && setCommandOpen(false)}
      className="mx-auto mt-[12vh] w-[calc(100vw-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-pop">
      {commandOpen && (
        <div onKeyDown={onKey}>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 text-faint" aria-hidden />
            <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} role="combobox" aria-expanded aria-controls="cmd-list" aria-label="Search commands"
              placeholder="Type a command or search people, reports and accounts" className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none" />
            <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-mute">Esc</kbd>
          </div>
          <ul id="cmd-list" role="listbox" className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
            {filtered.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-mute">No commands match &ldquo;{query}&rdquo;.</li>}
            {filtered.map((c, i) => {
              const header = c.group !== lastGroup;
              lastGroup = c.group;
              return (
                <li key={c.id} role="presentation">
                  {header && <p className="px-3 pb-1 pt-2 text-xs font-medium text-faint">{c.group}</p>}
                  <div id={`cmd-${c.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(c)}
                    className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm", i === active ? "bg-raised text-ink" : "text-mute")}>
                    <c.icon className={cn("size-4", i === active ? "text-gold" : "text-faint")} aria-hidden />
                    <span className="flex-1 truncate">{c.label}</span>
                    {i === active && <CornerDownLeft className="size-3.5 text-faint" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </dialog>
  );
}
