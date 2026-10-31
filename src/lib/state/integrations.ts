"use client";

import { createStore } from "../store";
import { logActivity } from "./activity";

export type IntegrationCategory = "Data sources" | "Communication" | "Engineering" | "Business";
export type IntegrationDef = { id: string; name: string; category: IntegrationCategory; description: string; field: { label: string; placeholder: string; kind: "key" | "url" } };

export const integrationCatalog: IntegrationDef[] = [
  { id: "snowflake", name: "Snowflake", category: "Data sources", description: "Query warehouse tables without copying data.", field: { label: "Account identifier", placeholder: "xy12345.eu-west-1", kind: "key" } },
  { id: "bigquery", name: "BigQuery", category: "Data sources", description: "Import datasets and schedule refreshes.", field: { label: "Project ID", placeholder: "my-analytics-project", kind: "key" } },
  { id: "postgres", name: "PostgreSQL", category: "Data sources", description: "Connect read replicas securely over SSH.", field: { label: "Connection host", placeholder: "db.internal.example.com", kind: "key" } },
  { id: "slack", name: "Slack", category: "Communication", description: "Send alerts and report digests to channels.", field: { label: "Webhook URL", placeholder: "https://hooks.slack.com/services/…", kind: "url" } },
  { id: "teams", name: "Microsoft Teams", category: "Communication", description: "Post updates to team channels.", field: { label: "Webhook URL", placeholder: "https://example.webhook.office.com/…", kind: "url" } },
  { id: "github", name: "GitHub", category: "Engineering", description: "Pull deployment and pull request activity.", field: { label: "Organization", placeholder: "meridian-labs", kind: "key" } },
  { id: "pagerduty", name: "PagerDuty", category: "Engineering", description: "Escalate critical alerts to on-call schedules.", field: { label: "Integration key", placeholder: "32-character routing key", kind: "key" } },
  { id: "linear", name: "Linear", category: "Engineering", description: "Link projects to issues and cycles.", field: { label: "Workspace slug", placeholder: "meridian", kind: "key" } },
  { id: "stripe", name: "Stripe", category: "Business", description: "Sync subscriptions, invoices and refunds.", field: { label: "Restricted key name", placeholder: "atlax-readonly", kind: "key" } },
  { id: "hubspot", name: "HubSpot", category: "Business", description: "Combine CRM pipeline data with product usage.", field: { label: "Portal ID", placeholder: "12345678", kind: "key" } },
  { id: "salesforce", name: "Salesforce", category: "Business", description: "Map accounts and opportunities to workspaces.", field: { label: "Instance URL", placeholder: "https://yourorg.my.salesforce.com", kind: "url" } },
  { id: "notion", name: "Notion", category: "Business", description: "Embed live charts in team documents.", field: { label: "Workspace name", placeholder: "Meridian Wiki", kind: "key" } },
];

export type IntegrationState = { connected: boolean; syncEvery: "15m" | "1h" | "6h" | "24h"; connectedAt?: string; detail?: string; notify: boolean };
export type IntegrationMap = Record<string, IntegrationState>;

const base = (): IntegrationState => ({ connected: false, syncEvery: "1h", notify: true });
const initial: IntegrationMap = Object.fromEntries(integrationCatalog.map((i) => [i.id, base()]));
for (const id of ["snowflake", "postgres", "slack", "github", "pagerduty", "stripe"]) initial[id] = { connected: true, syncEvery: id === "slack" ? "15m" : "1h", connectedAt: "2026-09-02", detail: "Demo connection", notify: true };

export const integrationsStore = createStore<IntegrationMap>("integrations", initial);

export function connectIntegration(id: string, detail: string) {
  integrationsStore.set((p) => ({ ...p, [id]: { ...(p[id] ?? base()), connected: true, connectedAt: new Date().toISOString().slice(0, 10), detail } }));
  logActivity("Connected integration", integrationCatalog.find((i) => i.id === id)?.name ?? id, "Settings");
}
export function disconnectIntegration(id: string) {
  integrationsStore.set((p) => ({ ...p, [id]: { ...(p[id] ?? base()), connected: false, connectedAt: undefined, detail: undefined } }));
  logActivity("Disconnected integration", integrationCatalog.find((i) => i.id === id)?.name ?? id, "Settings", "Notice");
}
export const configureIntegration = (id: string, patch: Partial<IntegrationState>) => integrationsStore.set((p) => ({ ...p, [id]: { ...(p[id] ?? base()), ...patch } }));
