"use client";

import { createStore, uid } from "../store";
import { DEFAULT_CUSTOM, type CustomRange, type RangeValue } from "../range";
import type { MetricKey } from "../data/metrics";
import { logActivity } from "./activity";
import { currentMember } from "./app";

export type ViewPage = "analytics" | "data-explorer";

export type AnalyticsState = { range: RangeValue; custom: CustomRange; metric: MetricKey; compare: boolean; tab: "trend" | "mix" | "compare"; hidden: string[] };
export type ExplorerState = {
  search: string;
  status: string; // "all" or status
  plan: string;
  region: string;
  from: string;
  to: string;
  sort: { key: string; dir: "asc" | "desc" } | null;
  hiddenColumns: string[];
  widths: Record<string, number>;
  pageSize: number;
  density: "comfortable" | "compact";
};
export type OverviewState = { range: RangeValue; custom: CustomRange };

export const DEFAULT_ANALYTICS: AnalyticsState = { range: "30d", custom: DEFAULT_CUSTOM, metric: "revenue", compare: true, tab: "trend", hidden: [] };
export const DEFAULT_EXPLORER: ExplorerState = { search: "", status: "all", plan: "all", region: "all", from: "", to: "", sort: null, hiddenColumns: [], widths: {}, pageSize: 10, density: "comfortable" };

export type PageState = { analytics: AnalyticsState; explorer: ExplorerState; overview: OverviewState };
export const pageStateStore = createStore<PageState>("page-state", { analytics: DEFAULT_ANALYTICS, explorer: DEFAULT_EXPLORER, overview: { range: "30d", custom: DEFAULT_CUSTOM } });
export const patchPage = <K extends keyof PageState>(k: K, patch: Partial<PageState[K]>) => pageStateStore.set((p) => ({ ...p, [k]: { ...p[k], ...patch } }));

export type SavedView = {
  id: string;
  name: string;
  page: ViewPage;
  state: AnalyticsState | ExplorerState;
  favorite: boolean;
  shared: boolean;
  archived?: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

const now = () => new Date().toISOString();
const mk = (id: string, name: string, page: ViewPage, state: AnalyticsState | ExplorerState, favorite = false, shared = false): SavedView => ({ id, name, page, state, favorite, shared, ownerId: "m1", createdAt: "2026-10-12T09:00:00Z", updatedAt: "2026-10-27T09:00:00Z" });

export const viewsStore = createStore<SavedView[]>("saved-views", [
  mk("v1", "Revenue, last 90 days vs prior", "analytics", { ...DEFAULT_ANALYTICS, range: "90d", metric: "revenue", compare: true }, true, true),
  mk("v2", "Sign-up momentum", "analytics", { ...DEFAULT_ANALYTICS, range: "30d", metric: "signups", tab: "trend" }, false),
  mk("v3", "Traffic mix this month", "analytics", { ...DEFAULT_ANALYTICS, range: "30d", metric: "sessions", tab: "mix" }, false, true),
  mk("v4", "Enterprise accounts at risk", "data-explorer", { ...DEFAULT_EXPLORER, plan: "Enterprise", status: "At risk" }, true, true),
  mk("v5", "Trials created this quarter", "data-explorer", { ...DEFAULT_EXPLORER, status: "Trial", from: "2026-08-01", to: "2026-10-30" }, false),
]);

export function createView(name: string, page: ViewPage, state: SavedView["state"]) {
  const v: SavedView = { id: uid("v"), name: name.trim(), page, state: structuredClone(state), favorite: false, shared: false, ownerId: currentMember().id, createdAt: now(), updatedAt: now() };
  viewsStore.set((p) => [v, ...p]);
  logActivity("Saved view", v.name, "Data");
  return v;
}
export const renameView = (id: string, name: string) => viewsStore.set((p) => p.map((v) => (v.id === id ? { ...v, name: name.trim(), updatedAt: now() } : v)));
export const toggleFavorite = (id: string) => viewsStore.set((p) => p.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)));
export const toggleArchived = (id: string) => viewsStore.set((p) => p.map((v) => (v.id === id ? { ...v, archived: !v.archived, updatedAt: now() } : v)));
export const toggleShared = (id: string) => viewsStore.set((p) => p.map((v) => (v.id === id ? { ...v, shared: !v.shared, updatedAt: now() } : v)));
export const duplicateView = (id: string) => {
  const src = viewsStore.get().find((v) => v.id === id);
  if (!src) return;
  const copy: SavedView = { ...structuredClone(src), id: uid("v"), name: `${src.name} (copy)`, favorite: false, ownerId: currentMember().id, createdAt: now(), updatedAt: now() };
  viewsStore.set((p) => [copy, ...p]);
  logActivity("Duplicated view", src.name, "Data");
};
export const deleteView = (id: string) => {
  const v = viewsStore.get().find((x) => x.id === id);
  viewsStore.set((p) => p.filter((x) => x.id !== id));
  if (v) logActivity("Deleted view", v.name, "Data", "Notice");
};
export const updateViewState = (id: string, state: SavedView["state"]) => viewsStore.set((p) => p.map((v) => (v.id === id ? { ...v, state: structuredClone(state), updatedAt: now() } : v)));

/** Applies a saved view's filters to the matching page state. */
export function applyView(v: SavedView) {
  if (v.page === "analytics") patchPage("analytics", { ...(v.state as AnalyticsState) });
  else patchPage("explorer", { ...DEFAULT_EXPLORER, ...(v.state as ExplorerState) });
}
export const viewHref = (v: SavedView) => (v.page === "analytics" ? "/analytics" : "/data-explorer");
