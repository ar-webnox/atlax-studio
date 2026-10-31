"use client";

import { createStore, uid } from "../store";
import { currentMember } from "./app";

export type Category = "Access" | "Data" | "Billing" | "Settings" | "Security" | "Reports" | "Projects";
export type Severity = "Info" | "Notice" | "Critical";
export type ActivityEntry = { id: string; ts: string; actor: string; action: string; target: string; category: Category; severity: Severity; ip: string; device: string };

const e = (id: string, ts: string, actor: string, action: string, target: string, category: Category, severity: Severity, ip: string, device: string): ActivityEntry => ({ id, ts: `2026-${ts}:00Z`, actor, action, target, category, severity, ip, device });

export const seedActivity: ActivityEntry[] = [
  e("e1", "10-30T14:42", "Omar Haddad", "Changed role", "Marcus Webb: Viewer to Suspended", "Access", "Notice", "86.98.12.40", "Chrome on macOS"),
  e("e2", "10-30T14:11", "Priya Nair", "Ran query", "accounts grouped by region", "Data", "Info", "49.207.88.15", "Firefox on Windows"),
  e("e3", "10-30T13:55", "Amara Okafor", "Updated plan", "Enterprise plan", "Billing", "Notice", "102.89.34.7", "Safari on iPhone"),
  e("e4", "10-30T12:30", "Lukas Brandt", "Rotated API key", "Ingest production key", "Security", "Notice", "91.64.20.3", "Chrome on Linux"),
  e("e5", "10-30T11:08", "System", "Blocked sign-in", "5 failed attempts for chloe@meridianlabs.io", "Security", "Critical", "185.220.101.4", "Unknown"),
  e("e6", "10-30T10:20", "Daniel Reyes", "Invited member", "tariq@meridianlabs.io", "Access", "Info", "187.190.45.2", "Chrome on macOS"),
  e("e7", "10-29T18:44", "Hannah Lindqvist", "Exported report", "Feature adoption by cohort (CSV)", "Reports", "Info", "78.72.19.8", "Chrome on Windows"),
  e("e8", "10-29T16:02", "Kenji Watanabe", "Connected integration", "PagerDuty", "Settings", "Info", "126.22.11.5", "Chrome on macOS"),
  e("e9", "10-29T09:37", "Omar Haddad", "Disabled 2FA exemption", "Finance team", "Security", "Notice", "86.98.12.40", "Chrome on macOS"),
  e("e10", "10-28T15:16", "Chloe Bennett", "Downloaded invoice", "INV-2026-1004", "Billing", "Info", "81.2.69.160", "Safari on macOS"),
  e("e11", "10-28T11:50", "Amara Okafor", "Edited workspace name", "Meridian Labs", "Settings", "Info", "102.89.34.7", "Safari on iPhone"),
  e("e12", "10-27T17:25", "Sofia Marchetti", "Shared saved view", "Weekly revenue by region", "Data", "Info", "93.34.201.9", "Chrome on macOS"),
];

export const activityStore = createStore<ActivityEntry[]>("activity", seedActivity);

/** Records an action by the current (demo) user. Newest first. */
export function logActivity(action: string, target: string, category: Category, severity: Severity = "Info") {
  const actor = currentMember().name;
  activityStore.set((p) => [{ id: uid("e"), ts: new Date().toISOString(), actor, action, target, category, severity, ip: "127.0.0.1", device: "This browser (demo)" }, ...p].slice(0, 300));
}
