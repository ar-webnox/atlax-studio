"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isActive, navGroups } from "@/lib/nav";
import { routePermission } from "@/lib/rbac";
import { useCan } from "@/components/rbac";
import { useShell } from "./shell-context";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/form";

function Nav({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const can = useCan();
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => { const p = routePermission(i.href); return !p || can(p); }) }))
    .filter((g) => g.items.length > 0);
  return (
    <nav aria-label="Main" className="scroll-thin flex-1 overflow-y-auto px-3 pb-2 pt-4">
      {groups.map((group, gi) => (
        <div key={group.label} className={cn(gi > 0 && "mt-5")}>
          {compact ? (
            gi > 0 && <div role="separator" className="mx-2 mb-3 h-px bg-line" />
          ) : (
            <p className="mb-1.5 px-2.5 text-xs font-medium text-faint">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    compact && "justify-center",
                    active ? "bg-raised text-ink" : "text-mute hover:bg-raised/70 hover:text-ink",
                  )}
                >
                  {active && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-gold" aria-hidden />}
                  <item.icon className={cn("size-[18px] shrink-0", active ? "text-gold" : "text-faint")} aria-hidden />
                  {compact ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </Link>
              );
              return <li key={item.href}>{compact ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ compact }: { compact: boolean }) {
  if (compact) return null;
  return (
    <div className="mx-3 mb-3 rounded-xl border border-line bg-raised p-3.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-ink">Data storage</span>
        <span className="tabular text-mute">68%</span>
      </div>
      <div className="mt-2.5"><Progress value={68} label="Data storage used" /></div>
      <p className="mt-2.5 text-xs leading-5 text-mute">1.36 TB of 2 TB used on the Enterprise plan.</p>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useShell();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      <div className="flex h-16 items-center border-b border-line px-3">
        <WorkspaceSwitcher compact={collapsed} />
      </div>
      <Nav compact={collapsed} />
      <SidebarFooter compact={collapsed} />
      <div className="border-t border-line p-3">
        <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
          <Button
            variant="ghost"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn("w-full", collapsed ? "px-0" : "justify-start")}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <><PanelLeftClose className="size-[18px]" /> Collapse</>}
          </Button>
        </Tooltip>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { mobileOpen, setMobileOpen } = useShell();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, setMobileOpen]);

  return (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-line bg-surface shadow-pop"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex h-16 items-center gap-2 border-b border-line px-3">
              <WorkspaceSwitcher />
              <Button ref={closeRef} variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="size-5" />
              </Button>
            </div>
            <Nav compact={false} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter compact={false} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
