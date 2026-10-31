"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3, Download, FilterX, Rows3, SearchX } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect, SearchField } from "@/components/ui/filters";
import { Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { Popover } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { Gate } from "@/components/rbac";
import { ViewsMenu } from "@/components/views/views-menu";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { useStore } from "@/lib/store";
import { ACCOUNT_STATUSES, PLANS, REGION_LIST, accounts, type Account, type AccountStatus } from "@/lib/data/accounts";
import { longDate } from "@/lib/range";
import { memberById } from "@/lib/data/people";
import { logActivity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";
import { DEFAULT_EXPLORER, pageStateStore, patchPage, type ExplorerState } from "@/lib/state/views";

type Col = { key: keyof Account | "ownerName"; label: string; width: number; align?: "right"; value: (a: Account) => string | number; cell: (a: Account) => React.ReactNode };

const statusTone: Record<AccountStatus, Tone> = { Active: "pos", Trial: "info", "At risk": "warn", Churned: "neg" };
const money = (n: number) => (n ? `$${n.toLocaleString("en-US")}` : "—");

const COLS: Col[] = [
  { key: "id", label: "ID", width: 110, value: (a) => a.id, cell: (a) => <span className="tabular text-mute">{a.id}</span> },
  { key: "company", label: "Company", width: 210, value: (a) => a.company, cell: (a) => <span className="font-medium">{a.company}</span> },
  { key: "region", label: "Region", width: 170, value: (a) => a.region, cell: (a) => <span className="text-mute">{a.region}</span> },
  { key: "plan", label: "Plan", width: 120, value: (a) => a.plan, cell: (a) => <Badge tone={a.plan === "Enterprise" ? "gold" : "neutral"}>{a.plan}</Badge> },
  { key: "status", label: "Status", width: 120, value: (a) => a.status, cell: (a) => <Badge tone={statusTone[a.status]} dot>{a.status}</Badge> },
  { key: "mrr", label: "MRR", width: 110, align: "right", value: (a) => a.mrr, cell: (a) => <span className="tabular">{money(a.mrr)}</span> },
  { key: "seats", label: "Seats", width: 90, align: "right", value: (a) => a.seats, cell: (a) => <span className="tabular text-mute">{a.seats}</span> },
  { key: "ownerName", label: "Owner", width: 170, value: (a) => memberById(a.owner).name, cell: (a) => <span className="flex items-center gap-2"><Avatar name={memberById(a.owner).name} size="sm" /><span className="text-mute">{memberById(a.owner).name}</span></span> },
  { key: "created", label: "Created", width: 130, value: (a) => a.created, cell: (a) => <span className="tabular text-mute">{a.created}</span> },
  { key: "lastActive", label: "Last active", width: 130, value: (a) => a.lastActive, cell: (a) => <span className="tabular text-mute">{a.lastActive}</span> },
];

export function AccountsTable() {
  const st: ExplorerState = { ...DEFAULT_EXPLORER, ...useStore(pageStateStore).explorer };
  const set = (p: Partial<ExplorerState>) => patchPage("explorer", { ...p });
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Account | null>(null);
  const dragging = useRef<{ key: string; x: number; w: number } | null>(null);

  const cols = COLS.filter((c) => !st.hiddenColumns.includes(c.key));
  const widthOf = (c: Col) => st.widths[c.key] ?? c.width;

  const rows = useMemo(() => {
    const q = st.search.trim().toLowerCase();
    let out = accounts.filter((a) =>
      (st.status === "all" || a.status === st.status) && (st.plan === "all" || a.plan === st.plan) && (st.region === "all" || a.region === st.region) &&
      (!st.from || a.created >= st.from) && (!st.to || a.created <= st.to) &&
      (!q || `${a.company} ${a.id} ${a.region} ${memberById(a.owner).name}`.toLowerCase().includes(q)));
    if (st.sort) {
      const col = COLS.find((c) => c.key === st.sort!.key);
      if (col) out = [...out].sort((a, b) => { const x = col.value(a), y = col.value(b); const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return st.sort!.dir === "asc" ? r : -r; });
    }
    return out;
  }, [st.search, st.status, st.plan, st.region, st.from, st.to, st.sort]);

  const pages = Math.max(1, Math.ceil(rows.length / st.pageSize));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * st.pageSize, cur * st.pageSize + st.pageSize);
  const filtered = st.search || st.status !== "all" || st.plan !== "all" || st.region !== "all" || st.from || st.to;
  const pad = st.density === "compact" ? "py-1.5" : "py-3";
  const totalWidth = cols.reduce((s, c) => s + widthOf(c), 0);

  const sortBy = (key: string) => set({ sort: st.sort?.key === key ? (st.sort.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" } });
  const reset = () => { set({ search: "", status: "all", plan: "all", region: "all", from: "", to: "" }); setPage(0); };

  const onResizeDown = (e: React.PointerEvent, c: Col) => {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = { key: c.key, x: e.clientX, w: widthOf(c) };
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const d = dragging.current; if (!d) return;
    set({ widths: { ...st.widths, [d.key]: Math.max(80, Math.min(520, d.w + e.clientX - d.x)) } });
  };
  const onResizeKey = (e: React.KeyboardEvent, c: Col) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    set({ widths: { ...st.widths, [c.key]: Math.max(80, Math.min(520, widthOf(c) + (e.key === "ArrowRight" ? 16 : -16))) } });
  };

  const exportCsv = () => {
    downloadCsv("accounts.csv", cols.map((c) => c.label), rows.map((a) => cols.map((c) => c.value(a))));
    logActivity("Exported data", `accounts: ${rows.length} rows (CSV)`, "Data");
    toast.success("CSV exported", `${rows.length} rows with ${cols.length} visible columns.`);
  };

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchField value={st.search} onChange={(v) => { set({ search: v }); setPage(0); }} placeholder="Search company, ID, region or owner" label="Search accounts" className="lg:w-80" />
            <FilterSelect label="Status" value={st.status as AccountStatus | "all"} options={ACCOUNT_STATUSES} onChange={(v) => { set({ status: v }); setPage(0); }} />
            <FilterSelect label="Plan" value={st.plan as (typeof PLANS)[number] | "all"} options={[...PLANS]} onChange={(v) => { set({ plan: v }); setPage(0); }} />
            <FilterSelect label="Region" value={st.region as (typeof REGION_LIST)[number] | "all"} options={REGION_LIST} onChange={(v) => { set({ region: v }); setPage(0); }} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {(["from", "to"] as const).map((k) => (
              <label key={k} className="text-xs text-mute">Created {k === "from" ? "from" : "to"}
                <input type="date" value={st[k]} onChange={(e) => { set({ [k]: e.target.value }); setPage(0); }}
                  className="mt-1 block h-9 rounded-lg border border-line bg-surface px-2 text-[13px] text-ink focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />
              </label>
            ))}
            {st.from && st.to && st.from > st.to && <p role="alert" className="pb-2 text-xs text-neg">The start date is after the end date.</p>}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {filtered && <Button variant="ghost" onClick={reset}><FilterX className="size-4" /> Clear filters</Button>}
              <Popover label="Choose columns" role="dialog" panelClassName="w-56 p-2"
                trigger={(p) => <Button {...p}><Columns3 className="size-4" /> Columns</Button>}>
                <fieldset>
                  <legend className="px-2 pb-1.5 pt-1 text-xs font-medium text-faint">Show columns</legend>
                  {COLS.map((c) => {
                    const on = !st.hiddenColumns.includes(c.key);
                    return (
                      <label key={c.key} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink hover:bg-raised">
                        <input type="checkbox" checked={on} disabled={on && cols.length === 1} className="size-4 accent-[var(--gold)]"
                          onChange={() => set({ hiddenColumns: on ? [...st.hiddenColumns, c.key] : st.hiddenColumns.filter((k) => k !== c.key) })} />
                        {c.label}
                      </label>
                    );
                  })}
                  <Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => set({ hiddenColumns: [], widths: {} })}>Reset columns</Button>
                </fieldset>
              </Popover>
              <Button onClick={() => set({ density: st.density === "compact" ? "comfortable" : "compact" })} aria-pressed={st.density === "compact"}><Rows3 className="size-4" /> {st.density === "compact" ? "Compact" : "Comfortable"}</Button>
              <ViewsMenu page="data-explorer" getState={() => ({ ...pageStateStore.get().explorer })} />
              <Gate permission="data:export"><Button onClick={exportCsv} disabled={rows.length === 0}><Download className="size-4" /> Export CSV</Button></Gate>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No accounts match these filters" description="Widen the date range or clear a filter to see more accounts." action={<Button onClick={reset}>Clear filters</Button>} />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="table-fixed text-left text-sm" style={{ width: totalWidth, minWidth: "100%" }}>
              <caption className="sr-only">Customer accounts. Select a row for details.</caption>
              <colgroup>{cols.map((c) => <col key={c.key} style={{ width: widthOf(c) }} />)}</colgroup>
              <thead>
                <tr className="border-b border-line bg-raised text-[13px] text-mute">
                  {cols.map((c) => {
                    const active = st.sort?.key === c.key;
                    return (
                      <th key={c.key} scope="col" aria-sort={active ? (st.sort!.dir === "asc" ? "ascending" : "descending") : undefined} className={cn("relative px-4 py-2.5 font-medium", c.align === "right" && "text-right")}>
                        <button type="button" onClick={() => sortBy(c.key)} className={cn("inline-flex max-w-full items-center gap-1 truncate hover:text-ink", c.align === "right" && "flex-row-reverse")}>
                          <span className="truncate">{c.label}</span>
                          {active && (st.sort!.dir === "asc" ? <ArrowUp className="size-3.5 shrink-0" aria-hidden /> : <ArrowDown className="size-3.5 shrink-0" aria-hidden />)}
                        </button>
                        <span role="separator" aria-orientation="vertical" tabIndex={0} aria-label={`Resize ${c.label} column`} aria-valuenow={widthOf(c)}
                          onPointerDown={(e) => onResizeDown(e, c)} onPointerMove={onResizeMove} onPointerUp={() => (dragging.current = null)} onKeyDown={(e) => onResizeKey(e, c)}
                          className="absolute right-0 top-1.5 bottom-1.5 w-2 cursor-col-resize touch-none rounded-sm after:absolute after:inset-y-0 after:right-0.5 after:w-px after:bg-line-strong hover:after:bg-gold focus-visible:after:bg-gold" />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((a) => (
                  <tr key={a.id} tabIndex={0} onClick={() => setDetail(a)} onKeyDown={(e) => e.key === "Enter" && setDetail(a)} className="cursor-pointer transition-colors hover:bg-raised/70 focus-visible:bg-raised">
                    {cols.map((c) => <td key={c.key} className={cn("truncate px-4 align-middle text-ink", pad, c.align === "right" && "text-right")}>{c.cell(a)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-[13px] text-mute sm:flex-row sm:items-center sm:justify-between">
          <span className="tabular" aria-live="polite">{rows.length === 0 ? "0 results" : `${cur * st.pageSize + 1}–${Math.min(rows.length, (cur + 1) * st.pageSize)} of ${rows.length} accounts`}</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">Rows<div className="w-20"><Select aria-label="Rows per page" value={String(st.pageSize)} onChange={(e) => { set({ pageSize: Number(e.target.value) }); setPage(0); }}>{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</Select></div></label>
            <Button size="icon-sm" variant="secondary" aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft className="size-4" /></Button>
            <span className="tabular">Page {cur + 1} of {pages}</span>
            <Button size="icon-sm" variant="secondary" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.company ?? ""} description={detail ? `${detail.id} · ${detail.plan} plan` : undefined} footer={<Button onClick={() => setDetail(null)}>Close</Button>}>
        {detail && (
          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3 text-sm">
            {([["Status", <Badge key="s" tone={statusTone[detail.status]} dot>{detail.status}</Badge>], ["Region", detail.region], ["Monthly revenue", money(detail.mrr)], ["Annualized", money(detail.mrr * 12)], ["Seats", String(detail.seats)],
              ["Account owner", memberById(detail.owner).name], ["Created", longDate(detail.created)], ["Last active", longDate(detail.lastActive)]] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-mute">{k}</dt><dd className="min-w-0 text-ink">{v}</dd></div>
            ))}
          </dl>
        )}
        <p className="mt-5 border-t border-line pt-3 text-xs text-faint">Demo account generated for this build. It does not exist in a real CRM or billing system.</p>
      </Modal>
    </>
  );
}
