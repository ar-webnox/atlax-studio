import {
  Activity, Bell, Bookmark, ChartLine, ChartNoAxesCombined, Database, FileText, FolderKanban,
  LayoutDashboard, Plug, ScrollText, Settings, ShieldCheck, Users, type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; description: string };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/overview", icon: LayoutDashboard, description: "Performance at a glance" }],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: ChartLine, description: "Traffic, engagement and revenue" },
      { label: "Real-time monitoring", href: "/monitoring", icon: Activity, description: "Live system health" },
      { label: "Internal analytics", href: "/internal-analytics", icon: ChartNoAxesCombined, description: "How your teams are performing" },
    ],
  },
  {
    label: "Data",
    items: [
      { label: "Reports", href: "/reports", icon: FileText, description: "Scheduled and on-demand reports" },
      { label: "Saved views", href: "/saved-views", icon: Bookmark, description: "Your bookmarked dashboards" },
      { label: "Data explorer", href: "/data-explorer", icon: Database, description: "Query your datasets" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban, description: "Track work across teams" },
      { label: "Team", href: "/team", icon: Users, description: "Members and invitations" },
      { label: "Roles & permissions", href: "/roles", icon: ShieldCheck, description: "Control who can do what" },
      { label: "Activity logs", href: "/activity", icon: ScrollText, description: "Audit trail for the workspace" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, description: "Alerts and updates" },
      { label: "Integrations", href: "/integrations", icon: Plug, description: "Connect your tools" },
      { label: "Settings", href: "/settings", icon: Settings, description: "Workspace preferences" },
    ],
  },
];

export const allNavItems: (NavItem & { group: string })[] = navGroups.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
