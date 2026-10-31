"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, BellRing, Database, Download, FilePlus2, Gauge, Share2, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer } from "@/components/ui/chart-container";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SegmentedControl } from "@/components/ui/filters";
import { Badge, type Tone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/form";
import { TrendChart } from "@/components/charts/trend-chart";
import { Gate } from "@/components/rbac";
import { useStore } from "@/lib/store";
import { downloadCsv } from "@/lib/csv";
import { METRICS, metricSeries, periodStats, type MetricKey } from "@/lib/data/metrics";
import { resolveRange } from "@/lib/range";
import { setIntent } from "@/lib/state/intent";
import { activityStore } from "@/lib/state/activity";
import { reportsStore, type ReportStatus } from "@/lib/state/reports";
import { pageStateStore, patchPage } from "@/lib/state/views";
import { toast } from "@/lib/state/toast";
import { useRouter } from "next/navigation";
import { RoleSpotlight } from "./role-spotlight";

type Metric = Extract<MetricKey, "revenue" | "users" | "efficiency">;

const teams = [
  { name: "Platform", score: 96, delta: 2.4, note: "41 deploys, 0 rollbacks" },
  { name: "Data", score: 91, delta: 1.2, note: "Median query time 1.8 s" },
  { name: "Growth", score: 88, delta: 4.6, note: "Activation up 3.2 pts" },
  { name: "Product", score: 84, delta: -1.3, note: "2 releases slipped a week" },
  { name: "Operations", score: 79, delta: -0.8, note: "Backlog at 118 tickets" },
];
const statusTone: Record<ReportStatus, Tone> = { Ready: "pos", Running: "info", Scheduled: "neutral", Failed: "neg", Draft: "neutral" };
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "Never run");
const when = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${d.toISOString().slice(11, 16)} UTC`;
};

export function OverviewView() {
  const router = useRouter();
  const ps = useStore(pageStateStore).overview;
  const activity = useStore(activityStore);
  const reports = useStore(reportsStore);
  const [metric, setMetric] = useState<Metric>("revenue");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = () => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 300);
  };

  const range = useMemo(() => resolveRange(ps.range, ps.custom), [ps.range, ps.custom]);
  const stats = useMemo(() => periodStats(range), [range]);
  const series = useMemo(() => metricSeries(range, metric), [range, metric]);
  const data = series.map((p) => ({ label: p.label, actual: Math.round(p.value * 10) / 10, previous: p.previous ?? 0 }));
  const spark = (m: MetricKey) => metricSeries(range, m).map((p) => p.value);
  const meta = METRICS[metric];
  const cmp = stats.hasPrevious ? "vs previous period" : "no earlier data";
  const d = (k: keyof typeof stats.delta) => (stats.hasPrevious ? stats.delta[k] : 0);

  const exportCsv = () => {
    downloadCsv(`overview-${range.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`, ["Period", meta.label, `${meta.label} (previous period)`], series.map((p) => [p.label, Math.round(p.value * 10) / 10, p.previous === null ? "" : Math.round(p.previous * 10) / 10]));
    toast.success("Overview exported", `${meta.label} for ${range.label} saved as CSV.`);
  };

  return (
    <>
      <PageHeader
        title="Overview"
        description="How the workspace is performing across revenue, users and operations. All figures are simulated demo data."
        actions={
          <>
            <DateRangePicker value={ps.range} onChange={(v) => { patchPage("overview", { range: v }); flash(); }} custom={ps.custom} onCustomChange={(c) => { patchPage("overview", { custom: c }); flash(); }} />
            <Gate permission="dashboards:export"><Button onClick={exportCsv}><Download className="size-4" /> Export</Button></Gate>
            <Gate permission="reports:create"><Button variant="primary" onClick={() => { setIntent("new-report"); router.push("/reports"); }}><FilePlus2 className="size-4" /> New report</Button></Gate>
          </>
        }
      />

      <RoleSpotlight />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" icon={Wallet} value={METRICS.revenue.short(stats.current.revenue)} delta={d("revenue")} comparison={cmp} series={spark("revenue")} hint="Total revenue in the period (demo data)." />
        <KpiCard label="Active users" icon={Users} value={METRICS.users.format(stats.current.users)} delta={d("users")} comparison={cmp} series={spark("users")} hint="Users active on the last day of the period." />
        <KpiCard label="Operational efficiency" icon={Gauge} value={METRICS.efficiency.format(stats.current.efficiency)} delta={d("efficiency")} deltaSuffix=" pts" comparison={cmp} series={spark("efficiency")} hint="Average share of work items completed within SLA." />
        <KpiCard label="Growth" icon={TrendingUp} value={`${d("signups") >= 0 ? "+" : ""}${d("signups")}%`} delta={d("signups")} deltaSuffix=" pts" comparison={cmp} series={spark("signups")} hint="Change in new sign-ups compared with the previous period." />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartContainer className="xl:col-span-2" title="Performance overview" description={`${meta.label} for ${range.label}, against the previous period.`} loading={loading} skeletonHeight={300}
          legend={[{ label: meta.label, color: "var(--c1)" }, ...(stats.hasPrevious ? [{ label: "Previous period", color: "var(--faint)" }] : [])]}
          actions={<SegmentedControl label="Metric" value={metric} onChange={(m) => { setMetric(m); flash(); }} options={[{ value: "revenue", label: "Revenue" }, { value: "users", label: "Users" }, { value: "efficiency", label: "Efficiency" }]} />}>
          <TrendChart label={`${meta.label} versus previous period`} data={data} xKey="label" height={300} format={meta.short}
            series={[{ key: "actual", label: meta.label, color: "var(--c1)", filled: true }, ...(stats.hasPrevious ? [{ key: "previous", label: "Previous period", color: "var(--faint)", dashed: true }] : [])]} />
        </ChartContainer>

        <Card className="flex flex-col">
          <CardHeader title="Quick actions" description="Jump straight into common tasks." />
          <CardBody className="grid gap-2 pt-4">
            <Gate permission="reports:create"><Button className="justify-start" onClick={() => { setIntent("new-report"); router.push("/reports"); }}><FilePlus2 className="size-4 text-gold" aria-hidden /> Create a report</Button></Gate>
            <Gate permission="team:create"><Button className="justify-start" onClick={() => { setIntent("invite"); router.push("/team"); }}><UserPlus className="size-4 text-gold" aria-hidden /> Invite a teammate</Button></Gate>
            {[{ label: "Open data explorer", icon: Database, href: "/data-explorer" }, { label: "Review live alerts", icon: BellRing, href: "/monitoring" }, { label: "Browse saved views", icon: Share2, href: "/saved-views" }].map((a) => (
              <Link key={a.label} href={a.href} className={buttonStyles({ className: "justify-start" })}>
                <a.icon className="size-4 text-gold" aria-hidden /> {a.label}<ArrowUpRight className="ml-auto size-4 text-faint" aria-hidden />
              </Link>
            ))}
          </CardBody>
          <div className="mt-auto border-t border-line px-5 py-4">
            <p className="text-[13px] font-medium text-ink">Up next</p>
            <p className="mt-0.5 text-xs leading-5 text-mute">Daily active users digest runs tomorrow at 06:00 for 1 recipient group.</p>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Recent activity" action={<Link href="/activity" className="text-[13px] font-medium text-gold-ink hover:underline">View all</Link>} />
          <ul className="mt-2 divide-y divide-line px-5 pb-2">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-3 py-3">
                <Avatar name={a.actor} />
                <p className="min-w-0 flex-1 text-[13px] leading-5 text-mute"><span className="font-medium text-ink">{a.actor}</span> {a.action.toLowerCase()} <span className="text-ink">{a.target}</span><span className="block text-xs text-faint">{when(a.ts)}</span></p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Team performance" description="Efficiency score this period (illustrative)." action={<Link href="/internal-analytics" className="text-[13px] font-medium text-gold-ink hover:underline">Details</Link>} />
          <ul className="space-y-4 p-5">
            {teams.map((t) => (
              <li key={t.name}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]"><span className="font-medium text-ink">{t.name}</span>
                  <span className="tabular text-ink">{t.score}<span className={t.delta >= 0 ? "ml-2 text-pos" : "ml-2 text-neg"}>{t.delta >= 0 ? "+" : ""}{t.delta}</span></span></div>
                <div className="mt-1.5"><Progress value={t.score} tone={t.score >= 90 ? "pos" : t.score >= 82 ? "gold" : "warn"} label={`${t.name} score`} /></div>
                <p className="mt-1 text-xs text-mute">{t.note}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Recent reports" action={<Link href="/reports" className="text-[13px] font-medium text-gold-ink hover:underline">All reports</Link>} />
          <ul className="mt-2 divide-y divide-line px-5 pb-2">
            {[...reports].sort((a, b) => (b.lastRun ?? "").localeCompare(a.lastRun ?? "")).slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate text-[13px] font-medium text-ink">{r.name}</p><p className="text-xs text-mute">{r.type} · {fmtDate(r.lastRun)}</p></div>
                <Badge tone={statusTone[r.status]} dot>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-faint"><Activity className="size-3.5" aria-hidden /> Demo data. Nothing here is read from a real business database.</p>
    </>
  );
}
