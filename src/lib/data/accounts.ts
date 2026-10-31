/** DEMO customer accounts. Generated deterministically; not from a real database. */
export type AccountStatus = "Active" | "Trial" | "At risk" | "Churned";
export type Plan = "Starter" | "Business" | "Enterprise";
export type Region = "North America" | "Europe" | "Asia Pacific" | "Latin America" | "Middle East & Africa";

export type Account = {
  id: string;
  company: string;
  region: Region;
  plan: Plan;
  status: AccountStatus;
  mrr: number;
  seats: number;
  owner: string;
  created: string; // ISO date
  lastActive: string; // ISO date
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const A = ["Northwind", "Halden", "Orbit", "Lumen", "Vantage", "Kestrel", "Altair", "Birchwood", "Cobalt", "Dunmore", "Ember", "Fjord", "Granite", "Harbor", "Ironleaf", "Juniper"];
const B = ["Logistics", "Health", "Retail", "Systems", "Capital", "Foods", "Energy", "Media", "Labs", "Works", "Mobility", "Analytics"];
const REGIONS: Region[] = ["North America", "North America", "Europe", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"];
const OWNERS = ["m2", "m3", "m4", "m7"];
const PRICE: Record<Plan, [number, number]> = { Starter: [90, 340], Business: [1100, 4200], Enterprise: [7500, 24000] };

export const accounts: Account[] = (() => {
  const r = rng(77);
  const used = new Set<string>();
  const out: Account[] = [];
  let i = 0;
  while (out.length < 64 && i < 400) {
    i++;
    const company = `${A[Math.floor(r() * A.length)]} ${B[Math.floor(r() * B.length)]}`;
    if (used.has(company)) continue;
    used.add(company);
    const pr = r();
    const plan: Plan = pr < 0.4 ? "Starter" : pr < 0.8 ? "Business" : "Enterprise";
    const sr = r();
    const status: AccountStatus = sr < 0.66 ? "Active" : sr < 0.8 ? "Trial" : sr < 0.92 ? "At risk" : "Churned";
    const [lo, hi] = PRICE[plan];
    const day = Math.floor(r() * 360);
    const created = new Date(Date.UTC(2026, 9, 30) - day * 86400000).toISOString().slice(0, 10);
    const active = new Date(Date.UTC(2026, 9, 30) - Math.floor(r() * (status === "Churned" ? 120 : 9)) * 86400000).toISOString().slice(0, 10);
    out.push({
      id: `ACC-${1000 + out.length}`,
      company,
      region: REGIONS[Math.floor(r() * REGIONS.length)],
      plan,
      status,
      mrr: status === "Churned" ? 0 : status === "Trial" ? 0 : Math.round(lo + r() * (hi - lo)),
      seats: plan === "Starter" ? 3 + Math.floor(r() * 12) : plan === "Business" ? 15 + Math.floor(r() * 80) : 120 + Math.floor(r() * 600),
      owner: OWNERS[Math.floor(r() * OWNERS.length)],
      created,
      lastActive: active < created ? created : active,
    });
  }
  return out;
})();

export const ACCOUNT_STATUSES: AccountStatus[] = ["Active", "Trial", "At risk", "Churned"];
export const PLANS: Plan[] = ["Starter", "Business", "Enterprise"];
export const REGION_LIST: Region[] = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"];

export const accountStats = () => {
  const paying = accounts.filter((a) => a.mrr > 0);
  return {
    total: accounts.length,
    active: accounts.filter((a) => a.status === "Active").length,
    atRisk: accounts.filter((a) => a.status === "At risk").length,
    mrr: paying.reduce((s, a) => s + a.mrr, 0),
  };
};
