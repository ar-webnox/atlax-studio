"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Download, Ellipsis, Eye, FilePlus2, FileSearch, History, Play, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DropdownMenu, type MenuEntry } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect, SearchField } from "@/components/ui/filters";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm";
import { Gate, useCan } from "@/components/rbac";
import { memberById } from "@/lib/data/people";
import { useStore } from "@/lib/store";
import { useIntent } from "@/lib/state/intent";
import { buildReport } from "@/lib/reports-build";
import { deleteReport, duplicateReport, reportTemplates, reportsStore, runReport, runsStore, type Report, type ReportStatus, type ReportType, type Run, type Template, REPORT_TYPES } from "@/lib/state/reports";
import { toast } from "@/lib/state/toast";
import { NewReportModal } from "./new-report-modal";
import { PreviewModal, ScheduleModal, exportReport } from "./report-modals";

type Tab = "reports" | "templates" | "history" | "schedules";
const statusTone: Record<ReportStatus, Tone> = { Ready: "pos", Running: "info", Scheduled: "neutral", Failed: "neg", Draft: "warn" };
const fmt = (iso: string | null) => (iso ? `${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}` : "Never");
const fmtTime = (iso: string) => `${fmt(iso)}, ${iso.slice(11, 16)} UTC`;
const scheduleText = (r: Report) => (r.schedule ? `${r.schedule.frequency}${r.schedule.frequency === "Daily" ? "" : ` · ${r.schedule.day}`} · ${r.schedule.time}` : "Manual");

export function ReportsView() {
  const confirm = useConfirm();
  const can = useCan();
  const reports = useStore(reportsStore);
  const runs = useStore(runsStore);
  const [tab, setTab] = useState<Tab>("reports");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReportType | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [preview, setPreview] = useState<Report | null>(null);
  const [scheduling, setScheduling] = useState<Report | null>(null);
  useIntent("new-report", () => { if (can("reports:create")) { setTemplate(null); setCreating(true); } });

  const rows = useMemo(() => reports.filter((r) => (type === "all" || r.type === type) && (status === "all" || r.status === status) && r.name.toLowerCase().includes(query.toLowerCase())), [reports, query, type, status]);
  const nameOf = (id: string) => reports.find((r) => r.id === id)?.name ?? "Deleted report";

  // Keep scheduled/failed state honest if a run finishes while a modal is open.
  useEffect(() => { if (preview) setPreview(reports.find((r) => r.id === preview.id) ?? null); }, [reports]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (r: Report) => {
    if (await confirm({ title: `Delete “${r.name}”?`, description: "The report, its schedule and its run history will be removed. This can't be undone.", confirmLabel: "Delete report", danger: true })) { deleteReport(r.id); toast.success("Report deleted"); }
  };
  const run = (r: Report) => { runReport(r.id, buildReport(r).rows.length); toast.info(`Running “${r.name}”`, "This takes a moment."); };

  const entries = (r: Report): MenuEntry[] => [
    { label: "Preview", icon: Eye, onSelect: () => setPreview(r) },
    ...(can("reports:edit") ? [{ label: "Run now", icon: Play, onSelect: () => run(r) }, { label: r.schedule ? "Edit schedule" : "Schedule", icon: CalendarClock, onSelect: () => setScheduling(r) }] : []),
    ...(can("reports:export") ? [{ label: "Download CSV", icon: Download, onSelect: () => exportReport(r, "csv") }, { label: "Download PDF", icon: Download, onSelect: () => exportReport(r, "pdf") }] : []),
    ...(can("reports:create") ? [{ label: "Duplicate", icon: Copy, onSelect: () => { duplicateReport(r.id); toast.success("Report duplicated"); } }] : []),
    ...(can("reports:delete") ? [{ type: "separator" as const }, { label: "Delete report", icon: Trash2, danger: true, onSelect: () => remove(r) }] : []),
  ];

  const columns: Column<Report>[] = [
    { key: "name", header: "Report", sortValue: (r) => r.name, cell: (r) => <button type="button" onClick={() => setPreview(r)} className="text-left"><p className="font-medium hover:underline">{r.name}</p><p className="text-xs text-mute">{r.type} · {r.format}</p></button> },
    { key: "owner", header: "Owner", hideBelow: "md", sortValue: (r) => memberById(r.ownerId).name, cell: (r) => <span className="flex items-center gap-2"><Avatar name={memberById(r.ownerId).name} size="sm" /><span className="text-mute">{memberById(r.ownerId).name}</span></span> },
    { key: "schedule", header: "Schedule", hideBelow: "lg", cell: (r) => <span className="text-mute">{scheduleText(r)}</span> },
    { key: "lastRun", header: "Last run", hideBelow: "lg", sortValue: (r) => r.lastRun ?? "", cell: (r) => <span className="tabular text-mute">{fmt(r.lastRun)}</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
    { key: "actions", header: "Actions", align: "right", cell: (r) => (
      <DropdownMenu label={`Actions for ${r.name}`} trigger={(p) => <Button variant="ghost" size="icon-sm" {...p} aria-label={`Actions for ${r.name}`}><Ellipsis className="size-4" /></Button>} entries={entries(r)} />) },
  ];

  const runCols: Column<Run>[] = [
    { key: "at", header: "Run at", sortValue: (r) => r.at, cell: (r) => <span className="tabular">{fmtTime(r.at)}</span> },
    { key: "report", header: "Report", sortValue: (r) => nameOf(r.reportId), cell: (r) => <span className="font-medium">{nameOf(r.reportId)}</span> },
    { key: "by", header: "Triggered by", hideBelow: "md", cell: (r) => <span className="text-mute">{r.by}</span> },
    { key: "rows", header: "Rows", align: "right", hideBelow: "sm", cell: (r) => <span className="tabular text-mute">{r.rows}</span> },
    { key: "dur", header: "Duration", align: "right", hideBelow: "lg", cell: (r) => <span className="tabular text-mute">{r.seconds}s</span> },
    { key: "status", header: "Result", cell: (r) => <Badge tone={r.status === "Ready" ? "pos" : "neg"} dot>{r.status === "Ready" ? "Succeeded" : "Failed"}</Badge> },
    { key: "dl", header: "Download", align: "right", cell: (r) => { const rep = reports.find((x) => x.id === r.reportId); return rep && r.status === "Ready" ? <Gate permission="reports:export"><Button size="sm" onClick={() => exportReport(rep, "csv")}><Download className="size-4" /> CSV</Button></Gate> : <span className="text-xs text-faint">—</span>; } },
  ];

  const scheduled = reports.filter((r) => r.schedule);

  return (
    <>
      <PageHeader title="Reports" description="Build, preview, schedule and export reports. Everything is generated from the same demo dataset as the dashboards."
        actions={<Gate permission="reports:create"><Button variant="primary" onClick={() => { setTemplate(null); setCreating(true); }}><FilePlus2 className="size-4" /> New report</Button></Gate>} />
      <Tabs<Tab> label="Report sections" value={tab} onChange={setTab}
        options={[{ value: "reports", label: "Reports", count: reports.length }, { value: "templates", label: "Templates", count: reportTemplates.length }, { value: "history", label: "History", count: runs.length }, { value: "schedules", label: "Schedules", count: scheduled.length }]} />

      <div className="mt-4">
        {tab === "reports" && (
          <Card>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
              <SearchField value={query} onChange={setQuery} placeholder="Search reports" label="Search reports" className="sm:w-64" />
              <FilterSelect label="Type" value={type} options={REPORT_TYPES} onChange={setType} />
              <FilterSelect label="Status" value={status} options={["Draft", "Ready", "Running", "Scheduled", "Failed"] as ReportStatus[]} onChange={setStatus} />
            </div>
            <DataTable caption="Reports" columns={columns} rows={rows} getRowId={(r) => r.id} pageSize={8}
              empty={<EmptyState icon={FileSearch} title="No reports match your filters" description="Try a different search term or clear the filters to see every report." action={<Button onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}>Clear filters</Button>} />} />
          </Card>
        )}

        {tab === "templates" && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reportTemplates.map((t) => (
              <li key={t.id}>
                <Card className="flex h-full flex-col p-5">
                  <Badge className="w-fit">{t.type}</Badge>
                  <h2 className="mt-3 font-display text-[15px] font-semibold text-ink">{t.name}</h2>
                  <p className="mt-1 flex-1 text-[13px] leading-5 text-mute">{t.description}</p>
                  <Gate permission="reports:create"><Button className="mt-4" onClick={() => { setTemplate(t); setCreating(true); }}>Use template</Button></Gate>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {tab === "history" && (
          <Card>
            <CardHeader title="Run history" description="Every time a report was generated, newest first." />
            <div className="mt-4"><DataTable caption="Report run history" columns={runCols} rows={[...runs].sort((a, b) => b.at.localeCompare(a.at))} getRowId={(r) => r.id} pageSize={8}
              empty={<EmptyState icon={History} title="No runs yet" description="Run a report and it will appear here." />} /></div>
          </Card>
        )}

        {tab === "schedules" && (
          scheduled.length === 0 ? <Card><EmptyState icon={CalendarClock} title="Nothing is scheduled" description="Schedule a report from the Reports tab to have it generated automatically." /></Card> : (
            <ul className="grid gap-4 md:grid-cols-2">
              {scheduled.map((r) => (
                <li key={r.id}>
                  <Card className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h2 className="truncate font-display text-[15px] font-semibold text-ink">{r.name}</h2><p className="mt-0.5 text-xs text-mute">{scheduleText(r)} UTC · {r.schedule!.format}</p></div>
                      <Badge tone={statusTone[r.status]} dot>{r.status}</Badge>
                    </div>
                    <p className="mt-3 truncate text-[13px] text-mute">To: {r.schedule!.recipients.join(", ")}</p>
                    <div className="mt-4 flex gap-2">
                      <Gate permission="reports:edit"><Button size="sm" onClick={() => setScheduling(r)}>Edit schedule</Button></Gate>
                      <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>Preview</Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <NewReportModal open={creating} onClose={() => setCreating(false)} template={template} />
      <PreviewModal report={preview} onClose={() => setPreview(null)} />
      <ScheduleModal report={scheduling} onClose={() => setScheduling(null)} />
    </>
  );
}
