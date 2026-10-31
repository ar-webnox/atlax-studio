import { DATA_DAYS, bucketSize, isoOfIndex, shortDate, type ResolvedRange } from "../range";

/**
 * DEMO DATASET. Everything below is generated deterministically in the browser.
 * It is not connected to any business database or analytics source.
 */
export type MetricKey = "revenue" | "users" | "sessions" | "signups" | "efficiency";
export type DayPoint = { date: string } & Record<MetricKey, number>;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const DOW = [0.9, 0.93, 1.04, 1.06, 1.05, 1.03, 0.96]; // Sun..Sat

export const daily: DayPoint[] = (() => {
  const r = rng(2026);
  return Array.from({ length: DATA_DAYS }, (_, i) => {
    const t = i / (DATA_DAYS - 1);
    const date = isoOfIndex(i);
    const dow = DOW[new Date(date + "T00:00:00Z").getUTCDay()];
    const n = () => 1 + (r() - 0.5) * 0.07;
    return {
      date,
      revenue: Math.round((41000 + 21500 * t ** 1.35) * dow * n()),
      users: i === DATA_DAYS - 1 ? 48213 : Math.round((35200 + 12900 * t) * (0.985 + dow * 0.015) * n()),
      sessions: Math.round((2750 + 790 * t) * dow * n()),
      signups: Math.round((186 + 58 * t) * dow * n()),
      efficiency: Math.min(97.5, Math.round((88.4 + 5.9 * t + (r() - 0.5) * 1.5) * 10) / 10),
    };
  });
})();

export const METRICS: Record<MetricKey, { label: string; kind: "sum" | "last" | "avg"; format: (n: number) => string; short: (n: number) => string; color: string }> = {
  revenue: { label: "Revenue", kind: "sum", format: (n) => `$${Math.round(n).toLocaleString("en-US")}`, short: (n) => `$${compact(n)}`, color: "var(--c1)" },
  users: { label: "Active users", kind: "last", format: (n) => Math.round(n).toLocaleString("en-US"), short: compact, color: "var(--c2)" },
  sessions: { label: "Sessions", kind: "sum", format: (n) => Math.round(n).toLocaleString("en-US"), short: compact, color: "var(--c3)" },
  signups: { label: "Sign-ups", kind: "sum", format: (n) => Math.round(n).toLocaleString("en-US"), short: compact, color: "var(--c4)" },
  efficiency: { label: "Efficiency", kind: "avg", format: (n) => `${n.toFixed(1)}%`, short: (n) => `${n.toFixed(0)}%`, color: "var(--c5)" },
};

function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function reduce(points: DayPoint[], metric: MetricKey): number {
  if (points.length === 0) return 0;
  const kind = METRICS[metric].kind;
  if (kind === "last") return points[points.length - 1][metric];
  const sum = points.reduce((s, p) => s + p[metric], 0);
  return kind === "avg" ? Math.round((sum / points.length) * 10) / 10 : sum;
}

export type Summary = Record<MetricKey, number> & { signupRate: number };

export function summarize(start: number, end: number): Summary {
  const pts = daily.slice(start, end + 1);
  const s = Object.fromEntries((Object.keys(METRICS) as MetricKey[]).map((m) => [m, reduce(pts, m)])) as Record<MetricKey, number>;
  return { ...s, signupRate: s.sessions ? (s.signups / s.sessions) * 100 : 0 };
}

export const pct = (cur: number, prev: number) => (prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 1000) / 10);

export type PeriodStats = {
  range: ResolvedRange;
  current: Summary;
  previous: Summary;
  hasPrevious: boolean;
  delta: Record<MetricKey | "signupRate", number>;
};

export function periodStats(range: ResolvedRange): PeriodStats {
  const prevEnd = range.start - 1;
  const prevStart = Math.max(0, range.start - range.days);
  const hasPrevious = prevEnd >= 0;
  const current = summarize(range.start, range.end);
  const previous = hasPrevious ? summarize(prevStart, prevEnd) : current;
  const keys = [...(Object.keys(METRICS) as MetricKey[]), "signupRate" as const];
  const delta = Object.fromEntries(keys.map((k) => [k, hasPrevious ? pct(current[k], previous[k]) : 0])) as PeriodStats["delta"];
  // Efficiency deltas read better as percentage points
  if (hasPrevious) delta.efficiency = Math.round((current.efficiency - previous.efficiency) * 10) / 10;
  return { range, current, previous, hasPrevious, delta };
}

export type SeriesPoint = { label: string; value: number; previous: number | null };

/** Bucketed series for a metric, with the previous period aligned index by index. */
export function metricSeries(range: ResolvedRange, metric: MetricKey): SeriesPoint[] {
  const size = bucketSize(range.days);
  const out: SeriesPoint[] = [];
  for (let s = range.start; s <= range.end; s += size) {
    const e = Math.min(range.end, s + size - 1);
    const cur = reduce(daily.slice(s, e + 1), metric);
    const ps = s - range.days, pe = e - range.days;
    const prev = ps >= 0 ? reduce(daily.slice(ps, pe + 1), metric) : null;
    const iso = isoOfIndex(s);
    out.push({ label: size === 30 ? shortDate(iso).split(" ")[0] : shortDate(iso), value: cur, previous: prev });
  }
  return out;
}

export const CHANNEL_SHARES = [
  { name: "Organic search", share: 0.38, color: "var(--c1)" },
  { name: "Direct", share: 0.25, color: "var(--c2)" },
  { name: "Referral", share: 0.16, color: "var(--c3)" },
  { name: "Paid", share: 0.12, color: "var(--c4)" },
  { name: "Email", share: 0.09, color: "var(--c5)" },
];
export const REGION_SHARES = [
  { name: "North America", share: 0.41 },
  { name: "Europe", share: 0.28 },
  { name: "Asia Pacific", share: 0.18 },
  { name: "Latin America", share: 0.08 },
  { name: "Middle East & Africa", share: 0.05 },
];
