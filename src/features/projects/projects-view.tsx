"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, Ellipsis, FolderInput, HeartPulse, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar";
import { Field, Input, Progress, Select } from "@/components/ui/form";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DropdownMenu, type MenuEntry } from "@/components/ui/dropdown";
import { FilterSelect, SearchField, SegmentedControl } from "@/components/ui/filters";
import { Modal } from "@/components/ui/modal";
import { KpiCard } from "@/components/ui/kpi-card";
import { useConfirm } from "@/components/ui/confirm";
import { Gate, useCan } from "@/components/rbac";
import { memberById } from "@/lib/data/people";
import { projectStages, type Health, type Project, type ProjectStage } from "@/lib/data/projects";
import { useStore } from "@/lib/store";
import { uiStore } from "@/lib/state/app";
import { addProject, deleteProject, moveProject, projectsStore, setHealth } from "@/lib/state/projects";
import { useIntent } from "@/lib/state/intent";
import { toast } from "@/lib/state/toast";
import { maxLength, minLength, required, validate } from "@/lib/validators";

const healthTone: Record<Health, Tone> = { "On track": "pos", "At risk": "warn", "Off track": "neg" };
const priorityTone: Record<Project["priority"], Tone> = { High: "gold", Medium: "neutral", Low: "neutral" };
const fmtDue = (iso: string) => (/^\d{4}-/.test(iso) ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : iso);

export function ProjectsView() {
  const confirm = useConfirm();
  const can = useCan();
  const projects = useStore(projectsStore);
  const ui = useStore(uiStore);
  const view = ui.projectsView;
  const [query, setQuery] = useState("");
  const [health, setHealth_] = useState<Health | "all">("all");
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ name: "", summary: "", stage: "Planning" as ProjectStage, priority: "Medium" as Project["priority"], due: "" });
  const [touched, setTouched] = useState(false);
  useIntent("new-project", () => { if (can("projects:create")) setCreating(true); });

  const nameErr = validate(f.name, required("Project name"), minLength("Project name", 3), maxLength("Project name", 80));
  const dueErr = f.due && f.due < "2026-10-31" ? "Pick a due date from tomorrow onward." : null;
  const rows = useMemo(() => projects.filter((p) => (health === "all" || p.health === health) && p.name.toLowerCase().includes(query.toLowerCase())), [projects, query, health]);

  const submit = () => {
    setTouched(true);
    if (nameErr || dueErr) return;
    addProject({ ...f, due: f.due || "TBD" });
    toast.success(`Project “${f.name.trim()}” created`);
    setCreating(false); setTouched(false); setF({ name: "", summary: "", stage: "Planning", priority: "Medium", due: "" });
  };
  const remove = async (p: Project) => {
    if (await confirm({ title: `Delete “${p.name}”?`, description: "The project and its task progress will be removed. This can't be undone.", confirmLabel: "Delete project", danger: true })) { deleteProject(p.id); toast.success("Project deleted"); }
  };

  const menu = (p: Project): MenuEntry[] => !can("projects:edit") ? [] : [
    ...projectStages.filter((s) => s !== p.stage).map((s) => ({ label: `Move to ${s}`, icon: FolderInput, onSelect: () => { moveProject(p.id, s); toast.success(`Moved to ${s}`, p.name); } })),
    { type: "separator" },
    ...(["On track", "At risk", "Off track"] as Health[]).filter((h) => h !== p.health).map((h) => ({ label: `Mark ${h.toLowerCase()}`, icon: HeartPulse, onSelect: () => { setHealth(p.id, h); toast.info(`Marked ${h.toLowerCase()}`, p.name); } })),
    ...(can("projects:delete") ? [{ type: "separator" as const }, { label: "Delete project", icon: Trash2, danger: true, onSelect: () => remove(p) }] : []),
  ];
  const Actions = ({ p }: { p: Project }) => menu(p).length ? <DropdownMenu label={`Actions for ${p.name}`} width="w-60" trigger={(t) => <Button variant="ghost" size="icon-sm" {...t} aria-label={`Actions for ${p.name}`}><Ellipsis className="size-4" /></Button>} entries={menu(p)} /> : null;

  const columns: Column<Project>[] = [
    { key: "name", header: "Project", sortValue: (r) => r.name, cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-mute">{r.code}</p></div> },
    { key: "stage", header: "Stage", hideBelow: "sm", sortValue: (r) => r.stage, cell: (r) => <span className="text-mute">{r.stage}</span> },
    { key: "health", header: "Health", sortValue: (r) => r.health, cell: (r) => <Badge tone={healthTone[r.health]} dot>{r.health}</Badge> },
    { key: "progress", header: "Progress", hideBelow: "md", sortValue: (r) => r.progress, cell: (r) => <div className="flex items-center gap-3"><div className="w-24"><Progress value={r.progress} label={`${r.name} progress`} /></div><span className="tabular text-mute">{r.progress}%</span></div> },
    { key: "owner", header: "Owner", hideBelow: "lg", cell: (r) => <span className="text-mute">{memberById(r.owner).name}</span> },
    { key: "due", header: "Due", align: "right", cell: (r) => <span className="tabular text-mute">{fmtDue(r.due)}</span> },
    { key: "actions", header: "Actions", align: "right", cell: (r) => <Actions p={r} /> },
  ];

  const active = projects.filter((p) => p.stage === "In progress").length;
  const tasks = projects.reduce((n, p) => n + p.tasks.done, 0);

  return (
    <>
      <PageHeader title="Projects" description="Follow work from planning to shipped and spot what needs attention early."
        actions={<Gate permission="projects:create"><Button variant="primary" onClick={() => setCreating(true)}><Plus className="size-4" /> New project</Button></Gate>} />

      <section aria-label="Project summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active projects" value={String(active)} delta={0} deltaSuffix="" comparison="in progress now" />
        <KpiCard label="Shipped" value={String(projects.filter((p) => p.stage === "Shipped").length)} delta={0} deltaSuffix="" comparison="delivered to date" />
        <KpiCard label="At risk or off track" value={String(projects.filter((p) => p.health !== "On track").length)} delta={0} deltaSuffix="" lowerIsBetter comparison="need attention" />
        <KpiCard label="Tasks completed" value={String(tasks)} delta={0} comparison="across all projects" />
      </section>

      <div className="my-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField value={query} onChange={setQuery} placeholder="Search projects" label="Search projects" className="sm:w-64" />
        <FilterSelect label="Health" value={health} options={["On track", "At risk", "Off track"] as Health[]} onChange={setHealth_} />
        <div className="sm:ml-auto"><SegmentedControl label="Layout" value={view} onChange={(v) => uiStore.set((u) => ({ ...u, projectsView: v }))} options={[{ value: "board", label: "Board" }, { value: "list", label: "List" }]} /></div>
      </div>

      {view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projectStages.map((stage) => {
            const items = rows.filter((p) => p.stage === stage);
            return (
              <section key={stage} aria-label={stage} className="min-w-0 rounded-xl bg-sunken/70 p-3">
                <h2 className="mb-3 flex items-center justify-between px-1 text-[13px] font-medium text-ink">{stage}<span className="rounded-md bg-surface px-1.5 text-xs tabular text-mute">{items.length}</span></h2>
                <ul className="space-y-3">
                  {items.map((p) => (
                    <li key={p.id}>
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-2"><span className="text-xs text-faint">{p.code}</span><div className="-mr-1.5 -mt-1.5 flex items-center gap-1"><Badge tone={priorityTone[p.priority]}>{p.priority}</Badge><Actions p={p} /></div></div>
                        <h3 className="mt-1 font-display text-[14px] font-semibold leading-5 text-ink">{p.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-mute">{p.summary}</p>
                        <div className="mt-2"><Badge tone={healthTone[p.health]} dot>{p.health}</Badge></div>
                        <div className="mt-3 flex items-center justify-between text-xs text-mute"><span className="flex items-center gap-1"><CheckSquare className="size-3.5" aria-hidden />{p.tasks.done}/{p.tasks.total}</span><span className="tabular">{p.progress}%</span></div>
                        <div className="mt-1.5"><Progress value={p.progress} tone={p.health === "On track" ? "gold" : p.health === "At risk" ? "warn" : "neg"} label={`${p.name} progress`} /></div>
                        <div className="mt-4 flex items-center justify-between"><AvatarGroup ids={p.team} /><span className="flex items-center gap-1 text-xs text-mute"><CalendarDays className="size-3.5" aria-hidden />{fmtDue(p.due)}</span></div>
                      </Card>
                    </li>
                  ))}
                  {items.length === 0 && <li className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-mute">No projects in this stage</li>}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <Card><DataTable caption="Projects" columns={columns} rows={rows} getRowId={(r) => r.id} pageSize={8} /></Card>
      )}

      <Modal open={creating} onClose={() => { setCreating(false); setTouched(false); }} title="New project" description="Projects group tasks, owners and deadlines." size="md"
        footer={<><Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Create project</Button></>}>
        <div className="space-y-4">
          <Field label="Project name">{(id) => (<><Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onBlur={() => setTouched(true)} placeholder="e.g. Churn early-warning model" autoFocus aria-invalid={touched && !!nameErr} aria-describedby={`${id}-e`} />{touched && nameErr && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{nameErr}</p>}</>)}</Field>
          <Field label="Summary (optional)">{(id) => <Input id={id} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="One sentence on the goal" />}</Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Stage">{(id) => <Select id={id} value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as ProjectStage })}>{projectStages.map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Priority">{(id) => <Select id={id} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Project["priority"] })}>{["High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Due date">{(id) => (<><input id={id} type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} aria-invalid={!!dueErr} className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />{dueErr && <p role="alert" className="text-xs text-neg">{dueErr}</p>}</>)}</Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
