export type RangeKey = "7d" | "30d" | "90d" | "12m";
export type RangeValue = RangeKey | "custom";
export type CustomRange = { from: string; to: string };

export const PRESET_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
export const DATA_DAYS = 365;
export const END_MS = Date.UTC(2026, 9, 30);
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isoOfIndex = (i: number) => new Date(END_MS - (DATA_DAYS - 1 - i) * DAY).toISOString().slice(0, 10);
export const indexOfIso = (iso: string) => Math.round((Date.parse(iso + "T00:00:00Z") - END_MS) / DAY) + DATA_DAYS - 1;
export const shortDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
export const longDate = (iso: string) => `${shortDate(iso)}, ${iso.slice(0, 4)}`;
export const MIN_ISO = isoOfIndex(0);
export const MAX_ISO = isoOfIndex(DATA_DAYS - 1);

export const DEFAULT_CUSTOM: CustomRange = { from: isoOfIndex(DATA_DAYS - 45), to: MAX_ISO };

export type ResolvedRange = { start: number; end: number; days: number; label: string; valid: boolean };

export function resolveRange(key: RangeValue, custom: CustomRange = DEFAULT_CUSTOM): ResolvedRange {
  if (key === "custom") {
    const a = Math.max(0, indexOfIso(custom.from));
    const b = Math.min(DATA_DAYS - 1, indexOfIso(custom.to));
    const valid = Number.isFinite(a) && Number.isFinite(b) && b >= a;
    const start = valid ? a : DATA_DAYS - 30, end = valid ? b : DATA_DAYS - 1;
    return { start, end, days: end - start + 1, label: `${shortDate(isoOfIndex(start))} – ${shortDate(isoOfIndex(end))}`, valid };
  }
  const days = PRESET_DAYS[key];
  return { start: DATA_DAYS - days, end: DATA_DAYS - 1, days, label: rangeLabels[key], valid: true };
}

export const rangeLabels: Record<RangeKey, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last quarter", "12m": "Last 12 months" };
export const rangeKeys: RangeKey[] = ["7d", "30d", "90d", "12m"];
export const bucketSize = (days: number) => (days <= 45 ? 1 : days <= 150 ? 7 : 30);
