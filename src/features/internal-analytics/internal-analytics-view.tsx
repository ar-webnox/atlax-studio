"use client";

import { useState } from "react";
import { CircleCheck, GitPullRequest, Rocket, Timer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer } from "@/components/ui/chart-container";
import { DateRangePicker, type RangeKey } from "@/components/ui/date-range-picker";
import { Progress } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { BarsChart } from "@/components/charts/bars-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { makeSeries, monthLabels } from "@/lib/data/series";

const workload = [
  { team: "Platform", planned: 42, unplanned: 11 },
  { team: "Data", planned: 36, unplanned: 14 },
  { team: "Product", planned: 31, unplanned: 6 },
  { team: "Growth", planned: 24, unplanned: 9 },
  { team: "Security", planned: 18, unplanned: 5 },
  { team: "Operations", planned: 27, unplanned: 19 },
];

const cycle = (() => {
  const dev = makeSeries(10, 4.8, 0.5, -0.1, 61);
  const review = makeSeries(10, 2.1, 0.3, -0.04, 62);
  return monthLabels(10).map((m, i) => ({ m, dev: Math.round(dev[i] * 10) / 10, review: Math.round(review[i] * 10) / 10 }));
})();

const objectives = [
  { name: "Cut median report generation time to under 20 seconds", owner: "Platform", progress: 82, tone: "pos" as const },
  { name: "Reach 95% of work items completed within SLA", owner: "Operations", progress: 71, tone: "gold" as const },
  { name: "Ship self-serve onboarding to all new workspaces", owner: "Product", progress: 38, tone: "warn" as const },
  { name: "Complete SOC 2 Type II evidence collection", owner: "Security", progress: 64, tone: "gold" as const },
  { name: "Lift weekly active workspaces to 3,200", owner: "Growth", progress: 90, tone: "pos" as const },
];

type Tool = { name: string; owner: string; users: number; adoption: number; trend: "Rising" | "Steady" | "Falling" };
const tools: Tool[] = [
  { name: "Data explorer", owner: "Data", users: 212, adoption: 88, trend: "Rising" },
  { name: "Scheduled reports", owner: "Operations", users: 186, adoption: 77, trend: "Steady" },
  { name: "Alert routing", owner: "Platform", users: 129, adoption: 54, trend: "Rising" },
  { name: "Saved views", owner: "Product", users: 164, adoption: 68, trend: "Steady" },
  { name: "Access reviews", owner: "Security", users: 41, adoption: 17, trend: "Falling" },
];

export function InternalAnalyticsView() {
  const [range, setRange] = useState<RangeKey>("90d");
  const columns: Column<Tool>[] = [
    { key: "name", header: "Internal tool", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "owner", header: "Owned by", hideBelow: "sm", cell: (r) => <span className="text-mute">{r.owner}</span> },
    { key: "users", header: "Active users", align: "right", cell: (r) => <span className="tabular">{r.users}</span>, sortValue: (r) => r.users },
    { key: "adoption", header: "Adoption", hideBelow: "md", cell: (r) => <div className="flex items-center gap-3"><div className="w-28"><Progress value={r.adoption} label={`${r.name} adoption`} /></div><span className="tabular text-mute">{r.adoption}%</span></div>, sortValue: (r) => r.adoption },
    { key: "trend", header: "Trend", cell: (r) => <Badge tone={r.trend === "Rising" ? "pos" : r.trend === "Falling" ? "neg" : "neutral"}>{r.trend}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Internal analytics"
        description="How your teams plan, build and respond, from delivery speed to tool adoption."
        actions={<><DateRangePicker value={range} onChange={setRange} /><Button>Share summary</Button></>}
      />
      <section aria-label="Delivery metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Median cycle time" lowerIsBetter icon={Timer} value="4.1 days" delta={-11.4} series={makeSeries(14, 30, 5, -0.6, 91)} hint="Time from first commit to production." />
        <KpiCard label="Deployments" icon={Rocket} value="312" delta={9.6} series={makeSeries(14, 20, 4, 0.7, 92)} />
        <KpiCard label="Work items closed" icon={CircleCheck} value="1,846" delta={5.2} series={makeSeries(14, 25, 5, 0.4, 93)} />
        <KpiCard label="Review wait time" lowerIsBetter icon={GitPullRequest} value="2.0 hrs" delta={-18.0} series={makeSeries(14, 30, 5, -0.8, 94)} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartContainer title="Workload by team" description="Planned compared with unplanned work items this quarter."
          legend={[{ label: "Planned", color: "var(--c1)" }, { label: "Unplanned", color: "var(--c4)" }]}>
          <BarsChart label="Workload by team" data={workload} xKey="team" stacked
            series={[{ key: "planned", label: "Planned", color: "var(--c1)" }, { key: "unplanned", label: "Unplanned", color: "var(--c4)" }]} />
        </ChartContainer>
        <ChartContainer title="Cycle time breakdown" description="Days spent building and waiting for review."
          legend={[{ label: "Development", color: "var(--c2)" }, { label: "Review", color: "var(--c3)" }]}>
          <TrendChart label="Cycle time by stage" data={cycle} xKey="m" format={(n) => `${n}d`}
            series={[{ key: "dev", label: "Development", color: "var(--c2)", filled: true }, { key: "review", label: "Review", color: "var(--c3)", filled: true }]} />
        </ChartContainer>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Quarterly objectives" description="Progress against Q4 company goals." />
          <ul className="space-y-5 p-5">
            {objectives.map((o) => (
              <li key={o.name}>
                <div className="flex items-start justify-between gap-4 text-[13px]">
                  <span className="font-medium leading-5 text-ink">{o.name}</span>
                  <span className="tabular text-ink">{o.progress}%</span>
                </div>
                <div className="mt-2"><Progress value={o.progress} tone={o.tone} label={o.name} /></div>
                <p className="mt-1.5 text-xs text-mute">{o.owner}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader title="Internal tool adoption" description="Which tools teams rely on and where usage is slipping." />
          <div className="mt-4"><DataTable caption="Internal tool adoption" columns={columns} rows={tools} getRowId={(r) => r.name} /></div>
        </Card>
      </section>
    </>
  );
}
