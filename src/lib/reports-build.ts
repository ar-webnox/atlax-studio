import { METRICS, metricSeries, periodStats, REGION_SHARES, type MetricKey } from "./data/metrics";
import { resolveRange, rangeLabels } from "./range";
import { membersStore } from "./state/app";
import type { Report } from "./state/reports";
import { accountStats, accounts } from "./data/accounts";

export type BuiltReport = {
  title: string;
  subtitle: string;
  kpis: { label: string; value: string; delta?: number }[];
  headers: string[];
  rows: (string | number)[][];
  notes: string[];
};

/** Builds report content from the shared demo dataset, so numbers match the dashboards. */
export function buildReport(report: Pick<Report, "name" | "type" | "range" | "metrics">): BuiltReport {
  const range = resolveRange(report.range);
  const stats = periodStats(range);
  const metrics: MetricKey[] = report.metrics.length ? report.metrics : ["revenue"];
  const subtitle = `${report.type} report · ${rangeLabels[report.range]} (${range.label}) · Demo data`;
  const notes = ["Generated from the built-in demo dataset. It is not connected to a business database."];

  if (report.type === "Compliance") {
    const members = membersStore.get();
    return {
      title: report.name, subtitle, notes,
      kpis: [{ label: "Members", value: String(members.length) }, { label: "Admins and owners", value: String(members.filter((m) => m.role === "Owner" || m.role === "Admin").length) }, { label: "Suspended", value: String(members.filter((m) => m.status === "Suspended").length) }],
      headers: ["Name", "Email", "Role", "Team", "Status", "Last active"],
      rows: members.map((m) => [m.name, m.email, m.role, m.team, m.status, m.lastActive]),
    };
  }

  const kpis = metrics.map((m) => ({ label: METRICS[m].label, value: METRICS[m].format(stats.current[m]), delta: stats.delta[m] }));
  const seriesByMetric = metrics.map((m) => metricSeries(range, m));
  const rows = seriesByMetric[0].map((p, i) => [p.label, ...seriesByMetric.map((s, j) => Math.round(s[i].value * (METRICS[metrics[j]].kind === "avg" ? 10 : 1)) / (METRICS[metrics[j]].kind === "avg" ? 10 : 1))]);
  const headers = ["Period", ...metrics.map((m) => METRICS[m].label)];

  if (report.type === "Financial") {
    const total = stats.current.revenue;
    REGION_SHARES.forEach((r) => rows.push([`Region: ${r.name}`, Math.round(total * r.share), ...metrics.slice(1).map(() => "")]));
    notes.push(`Region rows split total revenue using fixed demo shares. Active MRR across ${accounts.length} demo accounts: $${accountStats().mrr.toLocaleString("en-US")}.`);
  }
  return { title: report.name, subtitle, kpis, headers, rows, notes };
}

export function reportToPdfLines(b: BuiltReport): string[] {
  const lines = [b.subtitle, ""];
  b.kpis.forEach((k) => lines.push(`${k.label}: ${k.value}${k.delta !== undefined ? `  (${k.delta >= 0 ? "+" : ""}${k.delta}% vs previous period)` : ""}`));
  lines.push("", b.headers.join("  |  "), "-".repeat(70));
  b.rows.forEach((r) => lines.push(r.map((c) => (typeof c === "number" ? c.toLocaleString("en-US") : String(c))).join("  |  ")));
  lines.push("", ...b.notes);
  return lines;
}

export const fileBase = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
