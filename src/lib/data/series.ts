function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Deterministic pseudo-random series so server and client render identical data. */
export function makeSeries(n: number, base: number, volatility: number, trend: number, seed: number) {
  const r = rng(seed);
  let v = base;
  return Array.from({ length: n }, () => {
    v += (r() - 0.5) * volatility + trend;
    return Math.max(0, Math.round(v * 100) / 100);
  });
}

/** Linear trend from `start` to `end` with seeded noise, so charts match their KPI direction. */
export function trendSeries(n: number, start: number, end: number, noise: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const base = n === 1 ? end : start + ((end - start) * i) / (n - 1);
    return Math.round((base + (r() - 0.5) * 2 * noise) * 100) / 100;
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const END = Date.UTC(2026, 9, 30);

export function dayLabels(n: number, stepDays = 1) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(END - (n - 1 - i) * stepDays * 86400000);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  });
}

export function monthLabels(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 9 - (n - 1 - i), 1));
    return MONTHS[d.getUTCMonth()];
  });
}

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
