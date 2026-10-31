"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cpu, Gauge, Pause, Play, RefreshCw, Server, ShieldAlert, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer } from "@/components/ui/chart-container";
import { Badge, type Tone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress, Select, Switch } from "@/components/ui/form";
import { TrendChart } from "@/components/charts/trend-chart";
import { useStore } from "@/lib/store";
import { integrationsStore } from "@/lib/state/integrations";
import { membersStore, prefsStore, setPrefs } from "@/lib/state/app";
import { cn } from "@/lib/cn";

type Point = { t: string; rps: number; latency: number; errors: number; cpu: number; memory: number };
type EventItem = { id: number; level: "info" | "warn" | "error"; text: string; time: string };

// Deterministic noise in [0,1) so the simulated stream is reproducible.
const noise = (n: number, salt: number) => {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const START = 14 * 60 + 2;
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String((m * 7) % 60).padStart(2, "0")}`;

function sample(i: number): Point {
  const spike = noise(i, 3) > 0.93 ? 1 : 0;
  return {
    t: clock(START + i),
    rps: Math.round(1180 + Math.sin(i / 4) * 90 + (noise(i, 1) - 0.5) * 120),
    latency: Math.round(182 + Math.cos(i / 5) * 24 + (noise(i, 2) - 0.5) * 30 + spike * 190),
    errors: Math.round((0.1 + noise(i, 4) * 0.05 + spike * 0.35) * 100) / 100,
    cpu: Math.round(54 + Math.sin(i / 7) * 12 + noise(i, 5) * 6),
    memory: Math.round(61 + Math.sin(i / 11) * 5 + noise(i, 6) * 3),
  };
}

const feedPool: { level: EventItem["level"]; text: string }[] = [
  { level: "info", text: "Autoscaler added 2 nodes to ingest-pool-b" },
  { level: "warn", text: "Slow query on workspace halden-group (4.1 s)" },
  { level: "info", text: "Snapshot completed for events_2026_10" },
  { level: "error", text: "Webhook delivery failed for /hooks/billing, retrying" },
  { level: "info", text: "Cache hit ratio recovered to 94%" },
  { level: "warn", text: "Queue depth at 1,420 messages on report-renderer" },
  { level: "info", text: "Deploy 2026.10.30-3 passed health checks" },
  { level: "info", text: "Priya Nair ran a saved query in Data explorer" },
  { level: "info", text: "Kenji Watanabe acknowledged an alert" },
  { level: "warn", text: "Certificate for api.meridianlabs.io expires in 21 days" },
];

const INTERVALS = [["1000", "Every 1 second"], ["2000", "Every 2 seconds"], ["5000", "Every 5 seconds"], ["10000", "Every 10 seconds"], ["30000", "Every 30 seconds"]];
const levelTone: Record<EventItem["level"], Tone> = { info: "neutral", warn: "warn", error: "neg" };
const PAGES = ["Overview", "Analytics", "Reports", "Data explorer", "Projects", "Monitoring"];

type Svc = { name: string; region: string; base: "Operational" | "Maintenance"; load: number; uptime: string };
const SERVICES: Svc[] = [
  { name: "Ingest API", region: "us-east", base: "Operational", load: 74, uptime: "99.94%" },
  { name: "Query engine", region: "eu-west", base: "Operational", load: 57, uptime: "99.99%" },
  { name: "Report renderer", region: "us-east", base: "Operational", load: 44, uptime: "99.97%" },
  { name: "Event stream", region: "ap-south", base: "Operational", load: 63, uptime: "99.95%" },
  { name: "Auth service", region: "global", base: "Operational", load: 29, uptime: "100%" },
  { name: "Warehouse sync", region: "eu-west", base: "Maintenance", load: 12, uptime: "99.90%" },
];

export function MonitoringView() {
  const prefs = useStore(prefsStore);
  const integrations = useStore(integrationsStore);
  const members = useStore(membersStore);
  const [tick, setTick] = useState(40);
  const [points, setPoints] = useState<Point[]>(() => Array.from({ length: 40 }, (_, i) => sample(i)));
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, level: "warn", text: "p95 latency on Ingest API above 400 ms for 6 minutes", time: "14:38:12" },
    { id: 2, level: "info", text: "Deploy 2026.10.30-2 rolled out to eu-west", time: "14:21:44" },
    { id: 3, level: "info", text: "Warehouse sync entered maintenance window", time: "14:05:03" },
  ]);
  const [refreshedAt, setRefreshedAt] = useState(clock(START + 39));
  const seq = useRef(10);
  const tickRef = useRef(40);

  const step = useCallback(() => {
    const i = tickRef.current++;
    const p = sample(i);
    setTick(tickRef.current);
    setPoints((prev) => [...prev.slice(1), p]);
    setRefreshedAt(p.t);
    if (i % 2 === 0) {
      const pick = feedPool[Math.floor(noise(i, 9) * feedPool.length)];
      setEvents((prev) => [{ id: seq.current++, level: pick.level, text: pick.text, time: p.t }, ...prev].slice(0, 9));
    }
  }, []);

  useEffect(() => {
    if (!prefs.autoRefresh) return;
    const id = setInterval(step, prefs.refreshInterval);
    return () => clearInterval(id);
  }, [prefs.autoRefresh, prefs.refreshInterval, step]);

  const latest = points[points.length - 1];
  const prev = points[points.length - 2] ?? latest;
  const pctChange = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);

  const people = members.filter((m) => m.status !== "Suspended" && m.status !== "Invited");
  const online = people.map((m, i) => ({ m, on: (tick + i * 3) % 11 < 8, page: PAGES[(tick + i) % PAGES.length] })).filter((x) => x.on);

  const ingestDegraded = latest.latency > 260 || latest.errors > 0.3;
  const services = SERVICES.map((s) => ({ ...s, status: s.base === "Maintenance" ? "Maintenance" : s.name === "Ingest API" && ingestDegraded ? "Degraded" : "Operational" }));
  const degraded = services.some((s) => s.status === "Degraded");
  const tone: Record<string, Tone> = { Operational: "pos", Degraded: "warn", Maintenance: "info" };
  const connected = Object.entries(integrations).filter(([, v]) => v.connected).length;

  return (
    <>
      <PageHeader
        title="Real-time monitoring"
        description="Live traffic, latency and service health, with refresh controls."
        actions={
          <>
            <Badge tone="gold">Simulated stream</Badge>
            <Badge tone={prefs.autoRefresh ? "pos" : "neutral"} dot>{prefs.autoRefresh ? "Live" : "Paused"}</Badge>
          </>
        }
      />

      <div role="note" className="mb-4 rounded-xl border border-line bg-raised px-4 py-3 text-[13px] leading-5 text-mute">
        <strong className="font-medium text-ink">Demo data, not a live connection.</strong> The numbers below are generated in your browser to show how monitoring behaves. {connected} integration{connected === 1 ? " is" : "s are"} marked connected in <Link href="/integrations" className="font-medium text-gold-ink hover:underline">Integrations</Link>, but no real telemetry is being read from them.
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("size-3 rounded-full", degraded ? "bg-warn" : "bg-pos")} aria-hidden />
            <div><p className="text-sm font-medium text-ink" role="status">{degraded ? "Degraded performance on Ingest API" : "All systems operational"}</p>
              <p className="text-xs text-mute">Last refreshed {refreshedAt} UTC (simulated clock)</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] text-mute">Auto-refresh<Switch checked={prefs.autoRefresh} onChange={(v) => setPrefs({ autoRefresh: v })} label="Auto-refresh" /></label>
            <div className="w-44"><Select aria-label="Refresh interval" value={String(prefs.refreshInterval)} onChange={(e) => setPrefs({ refreshInterval: Number(e.target.value) })}>
              {INTERVALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
            <Button onClick={step}><RefreshCw className="size-4" /> Refresh now</Button>
            <Button variant="ghost" onClick={() => setPrefs({ autoRefresh: !prefs.autoRefresh })}>{prefs.autoRefresh ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Resume</>}</Button>
          </div>
        </div>
      </Card>

      <section aria-label="Live indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Requests per second" icon={Zap} value={latest.rps.toLocaleString("en-US")} delta={pctChange(latest.rps, prev.rps)} comparison="vs previous tick" />
        <KpiCard label="p95 latency" icon={Gauge} value={`${latest.latency} ms`} delta={pctChange(latest.latency, prev.latency)} lowerIsBetter comparison="vs previous tick" />
        <KpiCard label="Error rate" icon={ShieldAlert} value={`${latest.errors.toFixed(2)}%`} delta={Math.round((latest.errors - prev.errors) * 100) / 100} deltaSuffix=" pts" lowerIsBetter comparison="vs previous tick" />
        <KpiCard label="People online" icon={Users} value={String(online.length)} delta={0} deltaSuffix="" comparison={`of ${people.length} active members`} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="grid gap-4 xl:col-span-2">
          <ChartContainer title="Traffic" description="Requests per second, last 40 intervals." legend={[{ label: "Requests per second", color: "var(--c1)" }]}>
            <TrendChart label="Requests per second, simulated live" data={points} xKey="t" height={210} format={(n) => n.toLocaleString("en-US")} series={[{ key: "rps", label: "Requests/s", color: "var(--c1)", filled: true }]} />
          </ChartContainer>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartContainer title="Latency" description="p95 response time (ms)." legend={[{ label: "p95 latency", color: "var(--c2)" }]}>
              <TrendChart label="p95 latency, simulated live" data={points} xKey="t" height={170} format={(n) => `${n}ms`} series={[{ key: "latency", label: "p95", color: "var(--c2)", filled: true }]} />
            </ChartContainer>
            <ChartContainer title="Resource usage" description="CPU and memory (%)." legend={[{ label: "CPU", color: "var(--c3)" }, { label: "Memory", color: "var(--c4)" }]}>
              <TrendChart label="CPU and memory, simulated live" data={points} xKey="t" height={170} format={(n) => `${n}%`} series={[{ key: "cpu", label: "CPU", color: "var(--c3)" }, { key: "memory", label: "Memory", color: "var(--c4)" }]} />
            </ChartContainer>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title="Live activity feed" description="Newest first. Simulated events." />
            <ul className="mt-3 divide-y divide-line px-5 pb-3" aria-live="off">
              {events.map((e, i) => (
                <li key={e.id} className={cn("flex gap-3 py-2.5", i === 0 && prefs.autoRefresh && "animate-feed")}>
                  <Badge tone={levelTone[e.level]} className="h-fit capitalize">{e.level}</Badge>
                  <p className="min-w-0 flex-1 text-[13px] leading-5 text-ink">{e.text}<span className="block text-xs text-faint">{e.time} UTC</span></p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Online team members" description={`${online.length} of ${people.length} active members (simulated presence).`} />
            <ul className="mt-3 divide-y divide-line px-5 pb-3">
              {online.slice(0, 6).map(({ m, page }) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative"><Avatar name={m.name} /><span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-pos ring-2 ring-surface" aria-label="Online" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-ink">{m.name}</p><p className="text-xs text-mute">Viewing {page}</p></div>
                  <span className="text-xs text-faint">{m.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <Card className="mt-4">
        <CardHeader title="System status" description="Simulated service health, load and 30-day uptime." />
        <div className="scroll-thin mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">System status</caption>
            <thead><tr className="border-y border-line bg-raised text-[13px] text-mute">
              <th scope="col" className="px-5 py-2.5 font-medium">Service</th><th scope="col" className="px-5 py-2.5 font-medium max-sm:hidden">Region</th>
              <th scope="col" className="px-5 py-2.5 font-medium">Status</th><th scope="col" className="px-5 py-2.5 text-right font-medium max-md:hidden">Uptime</th><th scope="col" className="w-48 px-5 py-2.5 font-medium max-md:hidden">Load</th></tr></thead>
            <tbody className="divide-y divide-line">
              {services.map((s) => {
                const load = Math.min(99, s.load + (s.name === "Ingest API" ? Math.round((latest.rps - 1180) / 18) : 0));
                return (
                  <tr key={s.name}>
                    <td className="px-5 py-3 font-medium text-ink"><span className="flex items-center gap-2"><Server className="size-4 text-faint" aria-hidden />{s.name}</span></td>
                    <td className="px-5 py-3 text-mute max-sm:hidden">{s.region}</td>
                    <td className="px-5 py-3"><Badge tone={tone[s.status]} dot>{s.status}</Badge></td>
                    <td className="px-5 py-3 text-right tabular text-mute max-md:hidden">{s.uptime}</td>
                    <td className="px-5 py-3 max-md:hidden"><Progress value={load} tone={load > 80 ? "warn" : "gold"} label={`${s.name} load`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs text-faint"><Cpu className="size-3.5" aria-hidden /> Resource and traffic figures come from a deterministic simulation, not from your infrastructure.</p>
    </>
  );
}
