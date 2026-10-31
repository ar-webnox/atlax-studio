/**
 * Role-based access control model (DEMO).
 *
 * This module is pure and framework-free so the same `authorize()` can later run on a server
 * (route handlers, middleware, server actions) against a verified session. In this build it only
 * runs in the browser, which means it controls what the UI shows, NOT what data can be reached.
 */
export const ROLES = ["Owner", "Admin", "Manager", "Analyst", "Viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = { Owner: 5, Admin: 4, Manager: 3, Analyst: 2, Viewer: 1 };
export const ROLE_INFO: Record<Role, string> = {
  Owner: "Full control of the workspace, including billing and deletion.",
  Admin: "Manages people, integrations and settings. Cannot change billing.",
  Manager: "Leads projects and reports, can invite people. Cannot change roles.",
  Analyst: "Explores data and builds dashboards and reports.",
  Viewer: "Read-only access to dashboards, reports and projects.",
};

export const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export type Resource = { id: string; label: string; actions: Action[]; hint?: string };
export const RESOURCES: Resource[] = [
  { id: "dashboards", label: "Dashboards", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "internal", label: "Internal analytics", actions: ["view", "export"] },
  { id: "reports", label: "Reports", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "data", label: "Data explorer", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "projects", label: "Projects", actions: ["view", "create", "edit", "delete"] },
  { id: "team", label: "Team members", actions: ["view", "create", "edit", "delete"], hint: "Create = invite, Edit = change roles, Delete = remove" },
  { id: "roles", label: "Roles & permissions", actions: ["view", "edit"] },
  { id: "integrations", label: "Integrations", actions: ["view", "edit"] },
  { id: "activity", label: "Activity logs", actions: ["view", "export"] },
  { id: "settings", label: "Workspace settings", actions: ["view", "edit"] },
  { id: "billing", label: "Billing", actions: ["view", "edit"] },
];

export type Permission = `${string}:${Action}`;
export const ALL_PERMISSIONS: Permission[] = RESOURCES.flatMap((r) => r.actions.map((a) => `${r.id}:${a}` as Permission));

const grant = (res: string, actions: Action[]) => actions.map((a) => `${res}:${a}` as Permission);

export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  Owner: ALL_PERMISSIONS,
  Admin: ALL_PERMISSIONS.filter((p) => !p.startsWith("billing:edit")),
  Manager: [
    ...grant("dashboards", ["view", "create", "edit", "export"]),
    ...grant("internal", ["view", "export"]),
    ...grant("reports", ["view", "create", "edit", "delete", "export"]),
    ...grant("data", ["view", "create", "edit", "export"]),
    ...grant("projects", ["view", "create", "edit", "delete"]),
    ...grant("team", ["view", "create"]),
    ...grant("roles", ["view"]),
    ...grant("integrations", ["view"]),
    ...grant("activity", ["view", "export"]),
    ...grant("settings", ["view"]),
  ],
  Analyst: [
    ...grant("dashboards", ["view", "create", "edit", "export"]),
    ...grant("reports", ["view", "create", "edit", "export"]),
    ...grant("data", ["view", "create", "export"]),
    ...grant("projects", ["view", "create", "edit"]),
    ...grant("team", ["view"]),
    ...grant("integrations", ["view"]),
    ...grant("settings", ["view"]),
  ],
  Viewer: [...grant("dashboards", ["view"]), ...grant("reports", ["view"]), ...grant("data", ["view"]), ...grant("projects", ["view"]), ...grant("team", ["view"])],
};

export type PermissionMap = Record<Role, Permission[]>;

export function authorize(role: Role, permission: Permission, map: PermissionMap = DEFAULT_PERMISSIONS): boolean {
  if (role === "Owner") return true; // The Owner can never be locked out.
  return map[role]?.includes(permission) ?? false;
}

/** A member can only change people who rank below them and only assign roles below their own. */
export function canManageMember(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target] || (actor === "Owner" && target !== "Owner");
}
export function assignableRoles(actor: Role): Role[] {
  return ROLES.filter((r) => r !== "Owner" && ROLE_RANK[r] < ROLE_RANK[actor]);
}

/** Which permission a path needs. Longest prefix wins. */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/overview", permission: "dashboards:view" },
  { prefix: "/analytics", permission: "dashboards:view" },
  { prefix: "/monitoring", permission: "dashboards:view" },
  { prefix: "/saved-views", permission: "dashboards:view" },
  { prefix: "/internal-analytics", permission: "internal:view" },
  { prefix: "/reports", permission: "reports:view" },
  { prefix: "/data-explorer", permission: "data:view" },
  { prefix: "/projects", permission: "projects:view" },
  { prefix: "/team", permission: "team:view" },
  { prefix: "/roles", permission: "roles:view" },
  { prefix: "/activity", permission: "activity:view" },
  { prefix: "/integrations", permission: "integrations:view" },
];

export function routePermission(pathname: string): Permission | null {
  const hit = ROUTE_PERMISSIONS.filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return hit?.permission ?? null;
}

export const DEMO_AUTH_NOTICE =
  "Roles and permissions are simulated in your browser to show how the product behaves. They are not secure authorization and no real authentication or backend is connected.";
