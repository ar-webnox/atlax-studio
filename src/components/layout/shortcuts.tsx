"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { routePermission } from "@/lib/rbac";
import { setIntent } from "@/lib/state/intent";
import { useCan } from "@/components/rbac";
import { useShell } from "./shell-context";

const GO: Record<string, [string, string]> = {
  o: ["/overview", "Overview"], a: ["/analytics", "Analytics"], m: ["/monitoring", "Real-time monitoring"], r: ["/reports", "Reports"],
  v: ["/saved-views", "Saved views"], d: ["/data-explorer", "Data explorer"], p: ["/projects", "Projects"], t: ["/team", "Team"],
  l: ["/activity", "Activity logs"], i: ["/integrations", "Integrations"], n: ["/notifications", "Notifications"], s: ["/settings", "Settings"],
};

export function useShortcuts() {
  const router = useRouter();
  const can = useCan();
  const { setShortcutsOpen, setCommandOpen } = useShell();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaiting = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      if (awaiting.current) {
        awaiting.current = false;
        const dest = GO[e.key.toLowerCase()];
        if (dest) {
          const perm = routePermission(dest[0]);
          if (!perm || can(perm)) { e.preventDefault(); router.push(dest[0]); }
        }
        return;
      }
      if (e.key === "g") {
        awaiting.current = true;
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(() => (awaiting.current = false), 1200);
      } else if (e.key === "?") { e.preventDefault(); setShortcutsOpen(true); }
      else if (e.key === "/") { e.preventDefault(); const el = document.getElementById("global-search") as HTMLInputElement | null; if (el) el.focus(); else setCommandOpen(true); }
      else if (e.key === "c" && can("reports:create")) { e.preventDefault(); setIntent("new-report"); router.push("/reports"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, can, setShortcutsOpen, setCommandOpen]);
}

const rows: [string, string][] = [
  ["Ctrl / ⌘ + K", "Open the command menu"],
  ["/", "Focus global search"],
  ["?", "Show this list"],
  ["C", "Create a report (if your role allows it)"],
  ...Object.entries(GO).map(([k, v]) => [`G then ${k.toUpperCase()}`, `Go to ${v[1]}`] as [string, string]),
];

export function ShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useShell();
  return (
    <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard shortcuts" description="Shortcuts are ignored while you're typing in a field." footer={<Button onClick={() => setShortcutsOpen(false)}>Close</Button>}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        {rows.map(([k, d]) => (
          <div key={k} className="contents"><dt><kbd className="rounded-md border border-line bg-raised px-2 py-0.5 text-xs font-medium text-ink">{k}</kbd></dt><dd className="text-mute">{d}</dd></div>
        ))}
      </dl>
    </Modal>
  );
}
