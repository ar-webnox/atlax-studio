"use client";

import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect, SearchField } from "@/components/ui/filters";
import { Modal } from "@/components/ui/modal";
import { DateRangePicker, type RangeKey } from "@/components/ui/date-range-picker";
import { Gate } from "@/components/rbac";
import { useStore } from "@/lib/store";
import { PRESET_DAYS } from "@/lib/range";
import { downloadCsv } from "@/lib/csv";
import { activityStore, type ActivityEntry, type Category, type Severity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";

const sevTone: Record<Severity, Tone> = { Info: "neutral", Notice: "warn", Critical: "neg" };
const categories: Category[] = ["Access", "Data", "Billing", "Settings", "Security", "Reports", "Projects"];
const fmt = (ts: string) => `${new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${ts.slice(11, 16)}`;
const END = Date.UTC(2026, 9, 30, 23, 59);

export function ActivityView() {
  const entries = useStore(activityStore);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [range, setRange] = useState<RangeKey>("30d");
  const [open, setOpen] = useState<ActivityEntry | null>(null);

  const rows = useMemo(() => {
    const since = END - PRESET_DAYS[range] * 86400000;
    return entries.filter((e) => Date.parse(e.ts) >= since && (cat === "all" || e.category === cat) && (sev === "all" || e.severity === sev) && `${e.actor} ${e.action} ${e.target}`.toLowerCase().includes(query.toLowerCase()));
  }, [entries, query, cat, sev, range]);

  const columns: Column<ActivityEntry>[] = [
    { key: "time", header: "When", sortValue: (r) => r.ts, cell: (r) => <span className="tabular text-mute">{fmt(r.ts)}</span> },
    { key: "actor", header: "Actor", sortValue: (r) => r.actor, cell: (r) => <span className="flex items-center gap-2"><Avatar name={r.actor} size="sm" /><span className="font-medium">{r.actor}</span></span> },
    { key: "action", header: "Action", cell: (r) => <div><p>{r.action}</p><p className="max-w-xs truncate text-xs text-mute md:max-w-md">{r.target}</p></div> },
    { key: "category", header: "Category", hideBelow: "md", sortValue: (r) => r.category, cell: (r) => <span className="text-mute">{r.category}</span> },
    { key: "severity", header: "Severity", sortValue: (r) => r.severity, cell: (r) => <Badge tone={sevTone[r.severity]} dot>{r.severity}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Activity logs" description="A record of who did what in this workspace. Actions you take in this demo appear here immediately. Select a row for details."
        actions={<>
          <DateRangePicker value={range} onChange={setRange} />
          <Gate permission="activity:export"><Button disabled={rows.length === 0} onClick={() => { downloadCsv("activity-log.csv", ["Time (UTC)", "Actor", "Action", "Target", "Category", "Severity"], rows.map((r) => [r.ts, r.actor, r.action, r.target, r.category, r.severity])); toast.success("Activity log exported", `${rows.length} events.`); }}><Download className="size-4" /> Export CSV</Button></Gate>
        </>} />
      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder="Search actor, action or target" label="Search activity" className="sm:w-72" />
          <FilterSelect label="Category" value={cat} options={categories} onChange={setCat} />
          <FilterSelect label="Severity" value={sev} options={["Info", "Notice", "Critical"] as Severity[]} onChange={setSev} />
        </div>
        <DataTable caption="Activity log" columns={columns} rows={rows} getRowId={(r) => r.id} pageSize={10} onRowClick={setOpen}
          empty={<EmptyState icon={ScrollText} title="No activity matches" description="Widen the date range or clear a filter to see more events." action={<Button onClick={() => { setQuery(""); setCat("all"); setSev("all"); setRange("12m"); }}>Reset filters</Button>} />} />
      </Card>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.action ?? ""} description={open ? `${fmt(open.ts)} UTC` : undefined} size="md" footer={<Button onClick={() => setOpen(null)}>Close</Button>}>
        {open && (
          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
            {[["Actor", open.actor], ["Target", open.target], ["Category", open.category], ["Severity", open.severity], ["IP address", open.ip], ["Device", open.device], ["Event ID", `evt_${open.id}`]].map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-mute">{k}</dt><dd className="min-w-0 break-words text-ink">{v}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
