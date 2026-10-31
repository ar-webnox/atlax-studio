"use client";

import { createStore, uid } from "../store";
import type { MetricKey } from "../data/metrics";
import type { RangeKey } from "../range";
import { logActivity } from "./activity";
import { currentMember } from "./app";
import { pushNotification } from "../notifications-context";
import { toast } from "./toast";

export type ReportType = "Executive" | "Financial" | "Product" | "Operations" | "Compliance";
export type ReportStatus = "Draft" | "Ready" | "Running" | "Scheduled" | "Failed";
export type Frequency = "Daily" | "Weekly" | "Monthly";
export type Schedule = { frequency: Frequency; day: string; time: string; recipients: string[]; format: "PDF" | "CSV" };

export type Report = {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  ownerId: string;
  format: "PDF" | "CSV" | "Dashboard";
  range: RangeKey;
  metrics: MetricKey[];
  status: ReportStatus;
  lastRun: string | null;
  schedule: Schedule | null;
};
export type Run = { id: string; reportId: string; at: string; status: "Ready" | "Failed"; by: string; rows: number; seconds: number };

export const REPORT_TYPES: ReportType[] = ["Executive", "Financial", "Product", "Operations", "Compliance"];

export type Template = { id: string; name: string; type: ReportType; description: string; range: RangeKey; metrics: MetricKey[]; format: Report["format"] };
export const reportTemplates: Template[] = [
  { id: "t1", name: "Board metrics pack", type: "Executive", description: "Revenue, users, sign-ups and efficiency for the quarter.", range: "90d", metrics: ["revenue", "users", "signups", "efficiency"], format: "PDF" },
  { id: "t2", name: "Revenue reconciliation", type: "Financial", description: "Revenue by period and region, ready for finance review.", range: "30d", metrics: ["revenue"], format: "CSV" },
  { id: "t3", name: "Growth and acquisition", type: "Product", description: "Sessions and sign-ups with period-over-period change.", range: "30d", metrics: ["sessions", "signups"], format: "Dashboard" },
  { id: "t4", name: "Operational efficiency", type: "Operations", description: "Efficiency and traffic load across the period.", range: "7d", metrics: ["efficiency", "sessions"], format: "PDF" },
  { id: "t5", name: "Access review", type: "Compliance", description: "Every member with their role, team and last activity.", range: "30d", metrics: [], format: "CSV" },
];

const base = (id: string, name: string, type: ReportType, owner: string, status: ReportStatus, lastRun: string | null, schedule: Schedule | null, format: Report["format"], range: RangeKey, metrics: MetricKey[], description = ""): Report => ({ id, name, type, ownerId: owner, status, lastRun, schedule, format, range, metrics, description });
const sch = (frequency: Frequency, day: string, time: string, recipients: string[], format: "PDF" | "CSV" = "PDF"): Schedule => ({ frequency, day, time, recipients, format });

export const reportsStore = createStore<Report[]>("reports", [
  base("r1", "Weekly executive summary", "Executive", "m2", "Ready", "2026-10-26T07:30:00Z", sch("Weekly", "Monday", "07:30", ["leadership@meridianlabs.io"]), "PDF", "7d", ["revenue", "users", "signups", "efficiency"], "Leadership digest of revenue, users and efficiency."),
  base("r2", "Monthly revenue reconciliation", "Financial", "m9", "Ready", "2026-10-01T00:00:00Z", sch("Monthly", "1", "00:00", ["finance@meridianlabs.io"], "CSV"), "CSV", "30d", ["revenue"], "Revenue by period and region for finance."),
  base("r3", "Feature adoption by cohort", "Product", "m7", "Ready", "2026-10-28T06:00:00Z", sch("Weekly", "Wednesday", "06:00", ["product@meridianlabs.io"]), "Dashboard", "90d", ["sessions", "signups"]),
  base("r4", "Incident and uptime review", "Operations", "m6", "Ready", "2026-10-27T08:00:00Z", sch("Weekly", "Tuesday", "08:00", ["ops@meridianlabs.io"]), "PDF", "7d", ["efficiency", "sessions"]),
  base("r5", "Access review, Q4", "Compliance", "m8", "Failed", "2026-10-15T10:00:00Z", null, "CSV", "30d", []),
  base("r6", "Daily active users digest", "Product", "m3", "Scheduled", "2026-10-30T06:00:00Z", sch("Daily", "Every day", "06:00", ["growth@meridianlabs.io"]), "Dashboard", "7d", ["users", "sessions"]),
  base("r7", "Cost per workspace", "Financial", "m9", "Scheduled", "2026-10-01T00:00:00Z", sch("Monthly", "1", "00:00", ["finance@meridianlabs.io"], "CSV"), "CSV", "30d", ["revenue"]),
  base("r8", "Support response times", "Operations", "m2", "Ready", "2026-10-30T07:00:00Z", sch("Daily", "Every day", "07:00", ["support@meridianlabs.io"]), "Dashboard", "7d", ["efficiency"]),
  base("r9", "Board metrics pack", "Executive", "m1", "Ready", "2026-10-03T09:00:00Z", null, "PDF", "90d", ["revenue", "users", "signups", "efficiency"]),
]);

export const runsStore = createStore<Run[]>("report-runs", [
  { id: "x1", reportId: "r1", at: "2026-10-26T07:30:00Z", status: "Ready", by: "Schedule", rows: 8, seconds: 4 },
  { id: "x2", reportId: "r1", at: "2026-10-19T07:30:00Z", status: "Ready", by: "Schedule", rows: 8, seconds: 4 },
  { id: "x3", reportId: "r1", at: "2026-10-12T07:30:00Z", status: "Ready", by: "Schedule", rows: 8, seconds: 5 },
  { id: "x4", reportId: "r5", at: "2026-10-15T10:00:00Z", status: "Failed", by: "Daniel Reyes", rows: 0, seconds: 31 },
  { id: "x5", reportId: "r2", at: "2026-10-01T00:00:00Z", status: "Ready", by: "Schedule", rows: 30, seconds: 7 },
  { id: "x6", reportId: "r6", at: "2026-10-30T06:00:00Z", status: "Ready", by: "Schedule", rows: 7, seconds: 3 },
]);

export function createReport(input: { name: string; type: ReportType; description: string; format: Report["format"]; range: RangeKey; metrics: MetricKey[]; schedule?: Schedule | null }) {
  const r: Report = { id: uid("r"), name: input.name.trim(), type: input.type, description: input.description.trim(), ownerId: currentMember().id, format: input.format, range: input.range, metrics: input.metrics, status: input.schedule ? "Scheduled" : "Draft", lastRun: null, schedule: input.schedule ?? null };
  reportsStore.set((p) => [r, ...p]);
  logActivity("Created report", r.name, "Reports");
  return r;
}
export const updateReport = (id: string, patch: Partial<Report>) => reportsStore.set((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
export function deleteReport(id: string) {
  const r = reportsStore.get().find((x) => x.id === id);
  reportsStore.set((p) => p.filter((x) => x.id !== id));
  runsStore.set((p) => p.filter((x) => x.reportId !== id));
  if (r) logActivity("Deleted report", r.name, "Reports", "Notice");
}
export function duplicateReport(id: string) {
  const r = reportsStore.get().find((x) => x.id === id);
  if (!r) return;
  const copy: Report = { ...structuredClone(r), id: uid("r"), name: `${r.name} (copy)`, status: "Draft", lastRun: null, ownerId: currentMember().id };
  reportsStore.set((p) => [copy, ...p]);
  logActivity("Duplicated report", r.name, "Reports");
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
/** Simulated run: the report is generated locally from demo data after a short delay. */
export function runReport(id: string, rowCount: number) {
  const r = reportsStore.get().find((x) => x.id === id);
  if (!r || r.status === "Running") return;
  updateReport(id, { status: "Running" });
  const by = currentMember().name;
  timers.set(id, setTimeout(() => {
    const at = new Date().toISOString();
    runsStore.set((p) => [{ id: uid("x"), reportId: id, at, status: "Ready" as const, by, rows: rowCount, seconds: 2 }, ...p]);
    updateReport(id, { status: "Ready", lastRun: at });
    logActivity("Ran report", r.name, "Reports");
    pushNotification({ kind: "report", title: `${r.name} is ready`, body: `Generated from demo data (${rowCount} rows).`, href: "/reports" });
    toast.success(`${r.name} is ready`, "Open Reports to preview or download it.");
    timers.delete(id);
  }, 1600));
}
