export type ProjectStage = "Planning" | "In progress" | "In review" | "Shipped";
export type Health = "On track" | "At risk" | "Off track";

export type Project = {
  id: string;
  name: string;
  code: string;
  summary: string;
  stage: ProjectStage;
  progress: number;
  due: string;
  priority: "High" | "Medium" | "Low";
  health: Health;
  owner: string;
  team: string[];
  tasks: { done: number; total: number };
};

export const projectStages: ProjectStage[] = ["Planning", "In progress", "In review", "Shipped"];

export const projects: Project[] = [
  { id: "p1", name: "Revenue forecasting v2", code: "ATL-142", summary: "Replace spreadsheet forecasts with a model trained on 24 months of billing data.", stage: "In progress", progress: 64, due: "Nov 21", priority: "High", health: "On track", owner: "m3", team: ["m3", "m7", "m6"], tasks: { done: 23, total: 36 } },
  { id: "p2", name: "Customer health score", code: "ATL-156", summary: "Blend usage, support and billing signals into one account health indicator.", stage: "In review", progress: 88, due: "Nov 7", priority: "High", health: "On track", owner: "m7", team: ["m7", "m3"], tasks: { done: 29, total: 33 } },
  { id: "p3", name: "Warehouse migration", code: "ATL-118", summary: "Move event storage to the new columnar warehouse with zero reporting downtime.", stage: "In progress", progress: 41, due: "Dec 12", priority: "High", health: "At risk", owner: "m4", team: ["m4", "m6", "m10"], tasks: { done: 17, total: 42 } },
  { id: "p4", name: "Self-serve onboarding", code: "ATL-171", summary: "Guided setup flow so new workspaces reach a first dashboard in under ten minutes.", stage: "Planning", progress: 12, due: "Jan 16", priority: "Medium", health: "On track", owner: "m5", team: ["m5", "m11"], tasks: { done: 4, total: 30 } },
  { id: "p5", name: "Access review automation", code: "ATL-129", summary: "Quarterly permission audits generated and routed to owners automatically.", stage: "In progress", progress: 57, due: "Nov 28", priority: "Medium", health: "On track", owner: "m8", team: ["m8", "m2"], tasks: { done: 14, total: 25 } },
  { id: "p6", name: "Executive weekly digest", code: "ATL-104", summary: "Auto-built Monday summary of revenue, efficiency and incidents for leadership.", stage: "Shipped", progress: 100, due: "Oct 14", priority: "Low", health: "On track", owner: "m2", team: ["m2", "m7"], tasks: { done: 18, total: 18 } },
  { id: "p7", name: "Alert routing rules", code: "ATL-163", summary: "Route anomalies to the owning team with severity-based escalation.", stage: "In review", progress: 79, due: "Nov 10", priority: "Medium", health: "At risk", owner: "m6", team: ["m6", "m4"], tasks: { done: 19, total: 24 } },
  { id: "p8", name: "Mobile dashboard", code: "ATL-180", summary: "Condensed, offline-tolerant dashboard for field operations leads.", stage: "Planning", progress: 6, due: "Feb 6", priority: "Low", health: "On track", owner: "m11", team: ["m11", "m5"], tasks: { done: 2, total: 28 } },
  { id: "p9", name: "Usage-based billing sync", code: "ATL-97", summary: "Sync metered usage to the billing provider every hour.", stage: "Shipped", progress: 100, due: "Oct 2", priority: "High", health: "On track", owner: "m4", team: ["m4", "m9"], tasks: { done: 21, total: 21 } },
  { id: "p10", name: "Compliance export pack", code: "ATL-149", summary: "One-click evidence bundles for SOC 2 and ISO audits.", stage: "In progress", progress: 33, due: "Dec 5", priority: "Medium", health: "Off track", owner: "m8", team: ["m8", "m9"], tasks: { done: 8, total: 24 } },
];
