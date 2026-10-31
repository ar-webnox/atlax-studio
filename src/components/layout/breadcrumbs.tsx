"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { allNavItems, isActive } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { workspacesStore } from "@/lib/state/app";

export function Breadcrumbs() {
  const pathname = usePathname();
  const ws = useStore(workspacesStore);
  const wsName = ws.list.find((w) => w.id === ws.activeId)?.name ?? "Workspace";
  const current = allNavItems.find((i) => isActive(pathname, i.href));
  const crumbs = [
    { label: wsName, href: "/overview" },
    ...(current && current.group !== "Workspace" ? [{ label: current.group, href: undefined as string | undefined }] : []),
    { label: current?.label ?? "Page", href: undefined as string | undefined },
  ];
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center gap-1.5 ${!last && i > 0 ? "max-sm:hidden" : ""} ${!last && i === 0 ? "max-md:hidden" : ""}`}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-faint max-md:first:hidden" aria-hidden />}
              {c.href && !last ? (
                <Link href={c.href} className="truncate text-mute hover:text-ink">{c.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "truncate font-medium text-ink" : "truncate text-mute"}>{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
