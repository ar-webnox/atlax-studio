"use client";

import { useRef, useState } from "react";
import { Braces, ChevronRight, Database, Hash, Play, Plus, Table2, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { cn } from "@/lib/cn";
import { accounts } from "@/lib/data/accounts";
import { downloadCsv } from "@/lib/csv";
import { Gate } from "@/components/rbac";
import { Download } from "lucide-react";
import { toast } from "@/lib/state/toast";

type Row = { region: string; plan: string; accounts: number; revenue: number; churn: number };

const datasets = [
  { name: "accounts", rows: String(accounts.length), fields: [["region", "text"], ["plan", "text"], ["accounts", "number"], ["revenue", "number"], ["churn", "number"]] },
  { name: "events", rows: "9.4M", fields: [["event_name", "text"], ["workspace_id", "text"], ["occurred_at", "text"]] },
  { name: "invoices", rows: "212K", fields: [["invoice_id", "text"], ["amount", "number"], ["status", "text"]] },
  { name: "tickets", rows: "31.6K", fields: [["priority", "text"], ["team", "text"], ["resolved_hrs", "number"]] },
] as const;

/** Aggregates the demo accounts so these results match the table and reports. */
const GROUPS: Row[] = (() => {
  const map = new Map<string, Row & { total: number; churned: number }>();
  for (const a of accounts) {
    const k = `${a.region}|${a.plan}`;
    const r = map.get(k) ?? { region: a.region, plan: a.plan, accounts: 0, revenue: 0, churn: 0, total: 0, churned: 0 };
    r.accounts++; r.total++; r.revenue += a.mrr; if (a.status === "Churned") r.churned++;
    map.set(k, r);
  }
  return [...map.values()].map((r) => ({ region: r.region, plan: r.plan, accounts: r.accounts, revenue: r.revenue, churn: Math.round((r.churned / r.total) * 1000) / 10 }));
})();

const dimensions = ["region", "plan"] as const;
const metrics = [["accounts", "Accounts"], ["revenue", "MRR"], ["churn", "Churn rate"]] as const;

export function QueryBuilder() {
  const [dataset, setDataset] = useState("accounts");
  const [dims, setDims] = useState<string[]>(["region", "plan"]);
  const [mets, setMets] = useState<string[]>(["accounts", "revenue", "churn"]);
  const [minAccounts, setMinAccounts] = useState("0");
  const [state, setState] = useState<"idle" | "running" | "done">("done");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = () => {
    setState("running");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("done"), 600);
  };
  const toggle = (list: string[], v: string, set: (l: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const grouped = (() => {
    const key = (r: Row) => dims.map((d) => r[d as "region" | "plan"]).join("|");
    const m = new Map<string, Row & { n: number }>();
    for (const r of GROUPS) {
      const k = key(r), x = m.get(k) ?? { ...r, accounts: 0, revenue: 0, churn: 0, n: 0 };
      x.accounts += r.accounts; x.revenue += r.revenue; x.churn += r.churn * r.accounts; x.n += r.accounts;
      m.set(k, x);
    }
    return [...m.values()].map((x) => ({ ...x, churn: x.n ? Math.round((x.churn / x.n) * 10) / 10 : 0 }));
  })();
  const filtered = grouped.filter((r) => r.accounts >= Number(minAccounts));
  const columns: Column<Row>[] = [
    ...(dims.includes("region") ? [{ key: "region", header: "Region", sortValue: (r: Row) => r.region, cell: (r: Row) => <span className="font-medium">{r.region}</span> }] : []),
    ...(dims.includes("plan") ? [{ key: "plan", header: "Plan", sortValue: (r: Row) => r.plan, cell: (r: Row) => <Badge tone={r.plan === "Enterprise" ? "gold" : "neutral"}>{r.plan}</Badge> }] : []),
    ...(mets.includes("accounts") ? [{ key: "accounts", header: "Accounts", align: "right" as const, sortValue: (r: Row) => r.accounts, cell: (r: Row) => <span className="tabular">{r.accounts}</span> }] : []),
    ...(mets.includes("revenue") ? [{ key: "revenue", header: "MRR", align: "right" as const, sortValue: (r: Row) => r.revenue, cell: (r: Row) => <span className="tabular">${r.revenue.toLocaleString("en-US")}</span> }] : []),
    ...(mets.includes("churn") ? [{ key: "churn", header: "Churn rate", align: "right" as const, sortValue: (r: Row) => r.churn, cell: (r: Row) => <span className={cn("tabular", r.churn > 10 ? "text-neg" : "text-mute")}>{r.churn}%</span> }] : []),
  ];
  const sql = `SELECT ${[...dims, ...mets].join(", ")}\nFROM ${dataset}\n${Number(minAccounts) > 0 ? `HAVING accounts >= ${minAccounts}\n` : ""}${dims.length ? `GROUP BY ${dims.join(", ")}\n` : ""}ORDER BY ${mets[0] ?? dims[0] ?? "1"} DESC;`;
  const supported = dataset === "accounts";

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="self-start">
        <CardHeader title="Datasets" />
        <ul className="space-y-0.5 p-3">
          {datasets.map((d) => {
            const open = dataset === d.name;
            return (
              <li key={d.name}>
                <button type="button" aria-expanded={open} onClick={() => setDataset(d.name)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors", open ? "bg-raised text-ink" : "text-mute hover:bg-raised/70 hover:text-ink")}>
                  <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
                  <Table2 className="size-4 text-faint" aria-hidden /><span className="flex-1 font-medium">{d.name}</span><span className="tabular text-xs text-faint">{d.rows}</span>
                </button>
                {open && (
                  <ul className="ml-7 mt-1 space-y-0.5 border-l border-line pl-3">
                    {d.fields.map(([f, t]) => (<li key={f} className="flex items-center gap-2 py-1 text-xs text-mute">{t === "number" ? <Hash className="size-3.5 text-faint" aria-hidden /> : <Type className="size-3.5 text-faint" aria-hidden />}{f}</li>))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid min-w-0 gap-4">
        <Card>
          <CardHeader title="Query builder" description={`Dataset: ${dataset}`} action={<Button variant="primary" onClick={run} loading={state === "running"} disabled={!supported}><Play className="size-4" /> Run query</Button>} />
          <CardBody className="grid gap-5 pt-4 md:grid-cols-2">
            <fieldset><legend className="mb-2 text-[13px] font-medium text-ink">Group by</legend>
              <div className="flex flex-wrap gap-2">{dimensions.map((d) => { const on = dims.includes(d); return (
                <button key={d} type="button" aria-pressed={on} onClick={() => toggle(dims, d, setDims)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors", on ? "border-gold/40 bg-gold-soft text-gold-ink" : "border-line text-mute hover:text-ink")}>{on ? <X className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}{d}</button>); })}</div></fieldset>
            <fieldset><legend className="mb-2 text-[13px] font-medium text-ink">Measure</legend>
              <div className="flex flex-wrap gap-2">{metrics.map(([k, l]) => { const on = mets.includes(k); return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggle(mets, k, setMets)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors", on ? "border-gold/40 bg-gold-soft text-gold-ink" : "border-line text-mute hover:text-ink")}>{on ? <X className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}{l}</button>); })}</div></fieldset>
            <div><label htmlFor="min-accounts" className="mb-2 block text-[13px] font-medium text-ink">Only include groups with at least this many accounts</label>
              <Select id="min-accounts" value={minAccounts} onChange={(e) => setMinAccounts(e.target.value)}><option value="0">Any number</option><option value="2">2</option><option value="4">4</option><option value="8">8</option></Select></div>
            <div><p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink"><Braces className="size-3.5 text-faint" aria-hidden /> Generated SQL (illustrative)</p>
              <pre className="scroll-thin overflow-x-auto rounded-lg border border-line bg-sunken p-3 text-xs leading-5 text-mute">{sql}</pre></div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Results" description={!supported ? "Schema preview only" : state === "running" ? "Running query" : `${filtered.length} groups from ${accounts.length} demo accounts`}
            action={<Gate permission="data:export"><Button size="sm" disabled={!supported || filtered.length === 0} onClick={() => { downloadCsv("query-results.csv", ["Region", "Plan", "Accounts", "MRR", "Churn %"], filtered.map((r) => [r.region, r.plan, r.accounts, r.revenue, r.churn])); toast.success("Results exported"); }}><Download className="size-4" /> CSV</Button></Gate>} />
          <div className="mt-4">
            {!supported ? <EmptyState icon={Database} title="Only the accounts dataset can be queried" description="The other datasets show their schema so you can see how the explorer is organized. They aren't backed by demo data." />
              : state === "running" ? <TableSkeleton rows={6} cols={4} />
              : columns.length === 0 ? <EmptyState icon={Database} title="Choose something to show" description="Add at least one grouping or measure above, then run the query again." />
              : <DataTable caption="Query results" columns={columns} rows={filtered} getRowId={(r) => `${r.region}-${r.plan}`} pageSize={8} empty={<EmptyState icon={Database} title="No groups match" description="Lower the account threshold to include more groups." />} />}
          </div>
        </Card>
      </div>
    </div>
  );
}
