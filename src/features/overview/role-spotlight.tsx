"use client";

import Link from "next/link";
import { ArrowUpRight, Eye, FolderKanban, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { invitationsStore, membersStore, prefsStore } from "@/lib/state/app";
import { projectsStore } from "@/lib/state/projects";
import { reportsStore } from "@/lib/state/reports";
import { viewsStore } from "@/lib/state/views";
import { useSession } from "@/components/rbac";

/** A short, role-specific panel at the top of the Overview. Demo roles only. */
export function RoleSpotlight() {
  const { role, user } = useSession();
  const members = useStore(membersStore);
  const invites = useStore(invitationsStore);
  const projects = useStore(projectsStore);
  const reports = useStore(reportsStore);
  const views = useStore(viewsStore);
  const prefs = useStore(prefsStore);

  const cfg = {
    Owner: { icon: ShieldCheck, title: "Workspace health", stats: [[`${members.length}`, "members"], [`${invites.length}`, "pending invites"], [prefs.twoFa ? "On" : "Off", "two-factor requirement"]], href: "/team", cta: "Manage team" },
    Admin: { icon: ShieldCheck, title: "Access and security", stats: [[`${invites.length}`, "pending invites"], [`${members.filter((m) => m.status === "Suspended").length}`, "suspended members"], [prefs.twoFa ? "On" : "Off", "two-factor requirement"]], href: "/roles", cta: "Review permissions" },
    Manager: { icon: FolderKanban, title: "Your delivery picture", stats: [[`${projects.filter((p) => p.stage === "In progress").length}`, "projects in progress"], [`${projects.filter((p) => p.health !== "On track").length}`, "at risk or off track"], [`${reports.filter((r) => r.status === "Failed").length}`, "failed reports"]], href: "/projects", cta: "Open projects" },
    Analyst: { icon: Sparkles, title: "Your analysis workspace", stats: [[`${views.filter((v) => v.favorite).length}`, "favorite views"], [`${reports.filter((r) => r.status === "Draft").length}`, "draft reports"], [`${views.length}`, "saved views"]], href: "/data-explorer", cta: "Explore data" },
    Viewer: { icon: Eye, title: "View-only access", stats: [[`${reports.filter((r) => r.status === "Ready").length}`, "reports to read"], [`${views.filter((v) => v.shared).length}`, "shared views"], ["Read-only", "your access"]], href: "/saved-views", cta: "Browse saved views" },
  }[role];
  const Icon = cfg.icon;

  return (
    <Card className="mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold-soft text-gold-ink"><Icon className="size-5" aria-hidden /></span>
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-ink">{cfg.title}</h2>
          <p className="text-[13px] text-mute">Welcome back, {user.name.split(" ")[0]}. This panel changes with your demo role ({role}).</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-4 sm:gap-8">
        {cfg.stats.map(([v, l]) => (
          <div key={l}><dd className="font-display text-xl font-semibold tabular text-ink">{v}</dd><dt className="text-xs leading-4 text-mute">{l}</dt></div>
        ))}
      </dl>
      <Link href={cfg.href} className={buttonStyles({ className: "shrink-0" })}>{cfg.cta}<ArrowUpRight className="size-4 text-faint" aria-hidden /></Link>
    </Card>
  );
}
