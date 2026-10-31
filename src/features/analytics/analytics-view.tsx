"use client";

import { useMemo } from "react";
import { Download, MousePointerClick, ShoppingCart, Timer, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer } from "@/components/ui/chart-container";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SegmentedControl } from "@/components/ui/filters";
import { Switch } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarsChart } from "@/components/charts/bars-chart";
import { LegendToggle } from "@/components/charts/shared";
import { Gate } from "@/components/rbac";
import { ViewsMenu } from "@/components/views/views-menu";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { CHANNEL_SHARES, METRICS, REGION_SHARES, metricSeries, periodStats, type MetricKey } from "@/lib/data/metrics";
import { resolveRange } from "@/lib/range";
import { logActivity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";
import { DEFAULT_ANALYTICS, pageStateStore, patchPage, type AnalyticsState } from "@/lib/state/views";

const metricKeys = Object.keys(METRICS) as MetricKey[];

type Page = { path: string; views: number; time: string; bounce: number; conv: number };
const pageShares: [string, number, string, number, number][] = [
  ["/pricing", 0.22, "2m 48s", 31, 6.4], ["/product/dashboards", 0.19, "3m 12s", 27, 4.9], ["/", 0.18, "1m 36s", 44, 2.1],
  ["/docs/getting-started", 0.13, "5m 04s", 22, 3.7], ["/customers", 0.1, "2m 21s", 35, 3.2], ["/blog/forecasting-guide", 0.08, "4m 40s", 52, 1.4], ["/integrations", 0.07, "2m 02s", 38, 2.8],
];
const cohorts = [
  { label: "Jun", v: [100, 71, 58, 51, 47, 44] }, { label: "Jul", v: [100, 74, 61, 54, 49] }, { label: "Aug", v: [100, 76, 64, 57] }, { label: "Sep", v: [100, 79, 67] }, { label: "Oct", v: [100, 81] },
];

export function AnalyticsView() {
  const st: AnalyticsState = useStore(pageStateStore).analytics ?? DEFAULT_ANALYTICS;
  const set = (p: Partial<AnalyticsState>) => patchPage("analytics", p);
  const range = useMemo(() => resolveRange(st.range, st.custom), [st.range, st.custom]);
  const stats = useMemo(() => periodStats(range), [range]);
  const meta = METRICS[st.metric];
  const toggle = (key: string) => set({ hidden: st.hidden.includes(key) ? st.hidden.filter((k) => k !== key) : [...st.hidden, key] });

  const series = useMemo(() => metricSeries(range, st.metric), [range, st.metric]);
  const trendData = series.map((p) => ({ label: p.label, value: Math.round(p.value * 10) / 10, previous: p.previous ?? 0 }));
  const hasPrev = stats.hasPrevious && st.compare;

  const indexed = useMemo(() => {
    const all = metricKeys.map((m) => metricSeries(range, m));
    return all[0].map((p, i) => ({ label: p.label, ...Object.fromEntries(metricKeys.map((m, j) => [m, Math.round((all[j][i].value / (all[j][0].value || 1)) * 1000) / 10])) }));
  }, [range]);

  const sparks = (m: MetricKey) => metricSeries(range, m).map((p) => p.value);
  const regions = REGION_SHARES.map((r) => ({ name: r.name, revenue: Math.round(stats.current.revenue * r.share) }));
  const channels = CHANNEL_SHARES.map((c) => ({ name: c.name, value: Math.round(stats.current.sessions * c.share), color: c.color }));
  const funnel = [
    ["Visited site", stats.current.sessions], ["Started sign-up", Math.round(stats.current.sessions * 0.19)], ["Created workspace", stats.current.signups],
    ["Connected data", Math.round(stats.current.signups * 0.6)], ["Became paying", Math.round(stats.current.signups * 0.22)],
  ] as [string, number][];
  const pages: Page[] = pageShares.map(([path, share, time, bounce, conv]) => ({ path, views: Math.round(stats.current.sessions * 1.6 * share), time, bounce, conv }));

  const exportCsv = () => {
    const all = metricKeys.map((m) => metricSeries(range, m));
    downloadCsv(`analytics-${range.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`, ["Period", ...metricKeys.flatMap((m) => [METRICS[m].label, `${METRICS[m].label} (previous)`])],
      all[0].map((p, i) => [p.label, ...metricKeys.flatMap((_, j) => [Math.round(all[j][i].value * 10) / 10, all[j][i].previous === null ? "" : Math.round((all[j][i].previous ?? 0) * 10) / 10])]));
    logActivity("Exported analytics", `${range.label} (CSV)`, "Data");
    toast.success("Analytics exported", "Demo data for the selected period was saved as CSV.");
  };

  const columns: Column<Page>[] = [
    { key: "path", header: "Page", cell: (r) => <span className="font-medium">{r.path}</span>, sortValue: (r) => r.path },
    { key: "views", header: "Views", align: "right", cell: (r) => <span className="tabular">{r.views.toLocaleString("en-US")}</span>, sortValue: (r) => r.views },
    { key: "time", header: "Avg. time", align: "right", hideBelow: "sm", cell: (r) => <span className="tabular text-mute">{r.time}</span> },
    { key: "bounce", header: "Bounce rate", align: "right", hideBelow: "md", cell: (r) => <span className="tabular text-mute">{r.bounce}%</span>, sortValue: (r) => r.bounce },
    { key: "conv", header: "Conversion", align: "right", cell: (r) => <Badge tone={r.conv >= 4 ? "pos" : "neutral"}>{r.conv}%</Badge>, sortValue: (r) => r.conv },
  ];

  const prevNote = stats.hasPrevious ? "vs previous period" : "no earlier data";
  const delta = (k: keyof typeof stats.delta) => (stats.hasPrevious ? stats.delta[k] : 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Understand where visitors come from, what they do and what turns into revenue. Figures are simulated demo data."
        actions={
          <>
            <DateRangePicker value={st.range} onChange={(v) => set({ range: v })} custom={st.custom} onCustomChange={(c) => set({ custom: c })} />
            <ViewsMenu page="analytics" getState={() => ({ ...pageStateStore.get().analytics })} />
            <Gate permission="dashboards:export"><Button onClick={exportCsv}><Download className="size-4" /> Export CSV</Button></Gate>
          </>
        }
      />

      {!range.valid && <p role="alert" className="mb-4 text-sm text-neg">That custom period isn&apos;t valid, so the last 30 days are shown.</p>}

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" icon={Wallet} value={METRICS.revenue.short(stats.current.revenue)} delta={delta("revenue")} comparison={prevNote} series={sparks("revenue")} />
        <KpiCard label="Sessions" icon={MousePointerClick} value={METRICS.sessions.short(stats.current.sessions)} delta={delta("sessions")} comparison={prevNote} series={sparks("sessions")} />
        <KpiCard label="Sign-up rate" icon={ShoppingCart} value={`${stats.current.signupRate.toFixed(1)}%`} delta={delta("signupRate")} comparison={prevNote} series={metricSeries(range, "signups").map((p) => p.value)} hint="Sign-ups as a share of sessions." />
        <KpiCard label="Active users" icon={Timer} value={METRICS.users.format(stats.current.users)} delta={delta("users")} comparison={prevNote} series={sparks("users")} hint="Users active on the last day of the period." />
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs<AnalyticsState["tab"]> label="Chart views" value={st.tab} onChange={(tab) => set({ tab })} className="flex-1"
          options={[{ value: "trend", label: "Trend" }, { value: "compare", label: "Compare" }, { value: "mix", label: "Mix" }]} />
        <div className="flex flex-wrap items-center gap-3 pb-2">
          {st.tab !== "mix" && (
            <label className="flex items-center gap-2 text-[13px] text-mute">
              Compare to previous period
              <Switch checked={st.compare} onChange={(v) => set({ compare: v })} label="Compare to previous period" disabled={!stats.hasPrevious} />
            </label>
          )}
        </div>
      </div>


      <section className="mt-4 grid gap-4 xl:grid-cols-3" aria-live="polite">
        {st.tab === "trend" && (
          <ChartContainer className="xl:col-span-2" title={`${meta.label} over time`} description={`${range.label}${hasPrev ? ", with the previous period alongside" : ""}.`}
            actions={<SegmentedControl label="Metric" value={st.metric} onChange={(metric) => set({ metric })} options={metricKeys.slice(0, 4).map((m) => ({ value: m, label: METRICS[m].label }))} />}
            legend={<LegendToggle hidden={st.hidden} onToggle={toggle} items={[{ key: "value", label: meta.label, color: meta.color }, ...(hasPrev ? [{ key: "previous", label: "Previous period", color: "var(--faint)" }] : [])]} />}>
            <TrendChart label={`${meta.label} over time`} data={trendData} xKey="label" format={meta.short} height={300}
              series={[
                ...(st.hidden.includes("value") ? [] : [{ key: "value", label: meta.label, color: meta.color, filled: true }]),
                ...(hasPrev && !st.hidden.includes("previous") ? [{ key: "previous", label: "Previous period", color: "var(--faint)", dashed: true }] : []),
              ]} />
          </ChartContainer>
        )}

        {st.tab === "compare" && (
          <>
            <ChartContainer title={`${meta.label}: this period vs previous`} description="Grouped by period, so you can spot where change happened."
              actions={<SegmentedControl label="Metric" value={st.metric} onChange={(metric) => set({ metric })} options={metricKeys.slice(0, 4).map((m) => ({ value: m, label: METRICS[m].label }))} />}
              legend={[{ label: "This period", color: meta.color }, ...(hasPrev ? [{ label: "Previous period", color: "var(--faint)" }] : [])]}>
              <BarsChart label="Current versus previous period" data={trendData} xKey="label" format={meta.short}
                series={[{ key: "value", label: "This period", color: meta.color }, ...(hasPrev ? [{ key: "previous", label: "Previous period", color: "var(--faint)" }] : [])]} />
            </ChartContainer>
            <ChartContainer title="Growth index" description="Every metric rebased to 100 at the start of the period."
              legend={<LegendToggle hidden={st.hidden} onToggle={toggle} items={metricKeys.map((m) => ({ key: m, label: METRICS[m].label, color: METRICS[m].color }))} />}>
              <TrendChart label="Growth index across metrics" data={indexed} xKey="label" format={(n) => `${n}`}
                series={metricKeys.filter((m) => !st.hidden.includes(m)).map((m) => ({ key: m, label: METRICS[m].label, color: METRICS[m].color }))} />
            </ChartContainer>
          </>
        )}

        {st.tab === "mix" && (
          <>
            <ChartContainer className="xl:col-span-2" title="Revenue by region" description="Share of revenue for the selected period." legend={[{ label: "Revenue", color: "var(--c1)" }]}>
              <BarsChart label="Revenue by region" data={regions} xKey="name" layout="vertical" format={METRICS.revenue.short} series={[{ key: "revenue", label: "Revenue", color: "var(--c1)" }]} height={280} />
            </ChartContainer>
          </>
        )}

        <Card>
          <CardHeader title="Traffic by channel" description="Share of sessions this period." />
          <CardBody>
            <DonutChart label="Traffic by channel" data={channels} centerValue={METRICS.sessions.short(stats.current.sessions)} centerLabel="sessions" format={(n) => n.toLocaleString("en-US")} />
            <ul className="mt-4 space-y-2.5">
              {channels.map((c) => (
                <li key={c.name} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-mute"><span className="size-2.5 rounded-sm" style={{ background: c.color }} aria-hidden />{c.name}</span>
                  <span className="tabular text-ink">{Math.round((c.value / stats.current.sessions) * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Conversion funnel" description="From first visit to paying customer, for this period." />
          <ol className="space-y-4 p-5">
            {funnel.map(([step, value], i) => {
              const pct = Math.round((value / funnel[0][1]) * 100);
              const drop = i > 0 ? Math.round((1 - value / funnel[i - 1][1]) * 100) : 0;
              return (
                <li key={step}>
                  <div className="flex items-baseline justify-between text-[13px]"><span className="font-medium text-ink">{step}</span>
                    <span className="tabular text-mute">{value.toLocaleString("en-US")}{i > 0 && <span className="ml-2 text-neg">−{drop}%</span>}</span></div>
                  <div className="mt-1.5 h-7 overflow-hidden rounded-md bg-sunken"><div className="h-full rounded-md bg-gold/80" style={{ width: `${Math.max(pct, 2)}%` }} /></div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card>
          <CardHeader title="Retention by cohort" description="Share of each sign-up month still active (illustrative)." />
          <CardBody className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-xs">
              <caption className="sr-only">Retention percentage by monthly cohort</caption>
              <thead><tr className="text-mute"><th scope="col" className="text-left font-medium">Cohort</th>{["M0", "M1", "M2", "M3", "M4", "M5"].map((m) => <th key={m} scope="col" className="font-medium">{m}</th>)}</tr></thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.label}><th scope="row" className="text-left font-medium text-ink">{c.label}</th>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const v = c.v[i];
                      return <td key={i} className={cn("rounded-md py-2 tabular", v !== undefined && "text-ink")} style={v === undefined ? undefined : { background: `color-mix(in oklab, var(--gold) ${Math.round(v * 0.6)}%, var(--sunken))` }}>{v === undefined ? "" : `${v}%`}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader title="Top pages" description="Ranked by views. Select a column to sort." />
        <div className="mt-4"><DataTable caption="Top pages" columns={columns} rows={pages} getRowId={(r) => r.path} pageSize={6} /></div>
      </Card>
    </>
  );
}
