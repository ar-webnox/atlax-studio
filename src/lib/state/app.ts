"use client";

import { createStore, uid } from "../store";
import { members as seedMembers, workspaces as seedWorkspaces, type Member } from "../data/people";
import { DEFAULT_PERMISSIONS, type PermissionMap, type Role } from "../rbac";

export const sessionStore = createStore<{ userId: string; viewAs: Role | null }>("session", { userId: "m1", viewAs: null });
export const membersStore = createStore<Member[]>("members", seedMembers);
export const permissionsStore = createStore<PermissionMap>("permissions", DEFAULT_PERMISSIONS);

export type Invitation = { id: string; email: string; role: Role; invitedBy: string; sentAt: string };
export const invitationsStore = createStore<Invitation[]>("invitations", [
  { id: "i1", email: "noor@halden.co", role: "Analyst", invitedBy: "m2", sentAt: "2026-10-26" },
  { id: "i2", email: "j.lee@meridianlabs.io", role: "Viewer", invitedBy: "m2", sentAt: "2026-10-24" },
]);

export type Workspace = { id: string; name: string; slug: string; plan: string; timezone: string; fiscalStart: string };
export const workspacesStore = createStore<{ list: Workspace[]; activeId: string }>("workspaces", {
  activeId: "w1",
  list: seedWorkspaces.map((w) => ({ id: w.id, name: w.name, slug: w.name.toLowerCase().replace(/\s+/g, "-"), plan: w.plan, timezone: "utc", fiscalStart: "jan" })),
});

export type Prefs = {
  refreshInterval: number; // ms
  autoRefresh: boolean;
  density: "comfortable" | "compact";
  twoFa: boolean;
  sso: boolean;
  sessionHours: string;
  demoBannerDismissed: boolean;
};
export const prefsStore = createStore<Prefs>("prefs", { refreshInterval: 2000, autoRefresh: true, density: "comfortable", twoFa: true, sso: false, sessionHours: "8", demoBannerDismissed: false });
export const setPrefs = (patch: Partial<Prefs>) => prefsStore.set((p) => ({ ...p, ...patch }));

export type ApiKey = { id: string; name: string; prefix: string; created: string; used: string; revoked?: boolean };
export const apiKeysStore = createStore<ApiKey[]>("api-keys", [
  { id: "k1", name: "Ingest production", prefix: "atl_demo_8f2a…", created: "2026-08-14", used: "2 min ago" },
  { id: "k2", name: "Reporting service", prefix: "atl_demo_c91d…", created: "2026-06-02", used: "1 hr ago" },
  { id: "k3", name: "Staging", prefix: "atl_demo_47be…", created: "2026-05-19", used: "9 days ago" },
]);

// ---- actions
export const currentMember = () => {
  const s = sessionStore.get();
  return membersStore.get().find((m) => m.id === s.userId) ?? membersStore.get()[0];
};
export const effectiveRole = (): Role => sessionStore.get().viewAs ?? currentMember().role;

export const addInvitation = (email: string, role: Role) =>
  invitationsStore.set((p) => [{ id: uid("i"), email: email.trim().toLowerCase(), role, invitedBy: currentMember().id, sentAt: new Date().toISOString().slice(0, 10) }, ...p]);

export const uiStore = createStore<{ projectsView: "board" | "list" }>("ui", { projectsView: "board" });

export type ChannelPrefs = Record<string, { email: boolean; push: boolean }>;
export const notifPrefsStore = createStore<ChannelPrefs>("notif-prefs", {
  alerts: { email: true, push: true }, mentions: { email: true, push: true }, reports: { email: true, push: false }, digest: { email: true, push: false },
});
