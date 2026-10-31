"use client";

import { useMemo } from "react";
import { allNavItems } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { membersStore } from "@/lib/state/app";
import { projectsStore } from "@/lib/state/projects";
import { reportsStore } from "@/lib/state/reports";
import { viewsStore, viewHref } from "@/lib/state/views";
import { integrationCatalog } from "@/lib/state/integrations";
import { accounts } from "@/lib/data/accounts";
import { routePermission } from "@/lib/rbac";
import { useCan } from "@/components/rbac";

export type SearchKind = "Page" | "Project" | "Person" | "Report" | "Saved view" | "Integration" | "Account";
export type SearchEntry = { id: string; label: string; detail: string; kind: SearchKind; href: string };

export function useSearchIndex(): SearchEntry[] {
  const can = useCan();
  const members = useStore(membersStore);
  const projects = useStore(projectsStore);
  const reports = useStore(reportsStore);
  const views = useStore(viewsStore);
  const pages = allNavItems.filter((i) => {
    const p = routePermission(i.href);
    return !p || can(p);
  });
  const allowed = (href: string) => pages.some((p) => p.href === href);
  return useMemo(
    () => [
      ...pages.map((i) => ({ id: `page-${i.href}`, label: i.label, detail: i.description, kind: "Page" as const, href: i.href })),
      ...(allowed("/projects") ? projects.map((p) => ({ id: `project-${p.id}`, label: p.name, detail: `${p.code} · ${p.stage}`, kind: "Project" as const, href: "/projects" })) : []),
      ...members.map((m) => ({ id: `person-${m.id}`, label: m.name, detail: `${m.role}, ${m.team}`, kind: "Person" as const, href: "/team" })),
      ...(allowed("/reports") ? reports.map((r) => ({ id: `report-${r.id}`, label: r.name, detail: `${r.type} report`, kind: "Report" as const, href: "/reports" })) : []),
      ...(allowed("/saved-views") ? views.map((v) => ({ id: `view-${v.id}`, label: v.name, detail: v.page === "analytics" ? "Analytics view" : "Data explorer view", kind: "Saved view" as const, href: viewHref(v) })) : []),
      ...(allowed("/integrations") ? integrationCatalog.map((i) => ({ id: `int-${i.id}`, label: i.name, detail: i.category, kind: "Integration" as const, href: "/integrations" })) : []),
      ...(allowed("/data-explorer") ? accounts.map((a) => ({ id: `acc-${a.id}`, label: a.company, detail: `${a.id} · ${a.plan} · ${a.status}`, kind: "Account" as const, href: "/data-explorer" })) : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages.length, members, projects, reports, views],
  );
}

export function filterEntries(index: SearchEntry[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter((e) => e.label.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)).slice(0, limit);
}
