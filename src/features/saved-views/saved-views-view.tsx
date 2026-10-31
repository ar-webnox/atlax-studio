"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Bookmark, Copy, Ellipsis, ExternalLink, Pencil, Plus, Share2, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/filters";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { DropdownMenu } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm";
import { Sparkline } from "@/components/charts/sparkline";
import { Gate, useCan, useSession } from "@/components/rbac";
import { useStore } from "@/lib/store";
import { METRICS, metricSeries } from "@/lib/data/metrics";
import { rangeLabels, resolveRange } from "@/lib/range";
import { accounts } from "@/lib/data/accounts";
import { membersStore } from "@/lib/state/app";
import { toast } from "@/lib/state/toast";
import { minLength, maxLength, required, validate } from "@/lib/validators";
import { useIntent } from "@/lib/state/intent";
import {
  applyView, createView, deleteView, duplicateView, pageStateStore, renameView, toggleArchived, toggleFavorite, toggleShared, viewHref, viewsStore,
  type AnalyticsState, type ExplorerState, type SavedView, type ViewPage,
} from "@/lib/state/views";
import { cn } from "@/lib/cn";

type Tab = "all" | "favorites" | "mine" | "shared" | "archived";

function describe(v: SavedView): string {
  if (v.page === "analytics") {
    const s = v.state as AnalyticsState;
    const r = s.range === "custom" ? resolveRange("custom", s.custom).label : rangeLabels[s.range];
    return `${r} · ${METRICS[s.metric].label}${s.compare ? " · compared" : ""}`;
  }
  const s = v.state as ExplorerState;
  const parts = [s.status !== "all" && s.status, s.plan !== "all" && s.plan, s.region !== "all" && s.region, s.search && `“${s.search}”`, s.from && `${s.from} to ${s.to || "today"}`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All accounts";
}

function Preview({ v }: { v: SavedView }) {
  if (v.page === "analytics") {
    const s = v.state as AnalyticsState;
    const pts = metricSeries(resolveRange(s.range, s.custom), s.metric).map((p) => p.value);
    return <Sparkline values={pts.length > 1 ? pts : [1, 1]} color={METRICS[s.metric].color} height={56} />;
  }
  const s = v.state as ExplorerState;
  const n = accounts.filter((a) => (s.status === "all" || a.status === s.status) && (s.plan === "all" || a.plan === s.plan) && (s.region === "all" || a.region === s.region)).length;
  return <p className="flex h-14 items-end text-[13px] text-mute"><span className="font-display text-2xl font-semibold tabular text-ink">{n}</span>&nbsp;matching accounts</p>;
}

export function SavedViewsView() {
  const router = useRouter();
  const confirm = useConfirm();
  const can = useCan();
  const { user } = useSession();
  const views = useStore(viewsStore);
  const members = useStore(membersStore);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<SavedView | null>(null);
  const [name, setName] = useState("");
  const [page, setPage] = useState<ViewPage>("analytics");
  const [touched, setTouched] = useState(false);
  useIntent("save-view", () => setCreating(true));

  const err = validate(name, required("View name"), minLength("View name", 3), maxLength("View name", 60));
  const mine = (v: SavedView) => v.ownerId === user.id;
  const visible = useMemo(() => views.filter((v) => {
    if (tab === "archived") return !!v.archived;
    if (v.archived) return false;
    if (tab === "favorites" && !v.favorite) return false;
    if (tab === "mine" && !mine(v)) return false;
    if (tab === "shared" && !(v.shared && !mine(v))) return false;
    return v.name.toLowerCase().includes(query.toLowerCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [views, tab, query, user.id]);
  const count = (f: (v: SavedView) => boolean) => views.filter((v) => !v.archived && f(v)).length;
  const ownerName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  const open = (v: SavedView) => { applyView(v); toast.info(`Opened “${v.name}”`, "Its filters and date range were applied."); router.push(viewHref(v)); };
  const closeModal = () => { setCreating(false); setRenaming(null); setTouched(false); setName(""); };
  const submit = () => {
    setTouched(true);
    if (err) return;
    if (renaming) { renameView(renaming.id, name); toast.success("View renamed"); }
    else { const state = page === "analytics" ? pageStateStore.get().analytics : pageStateStore.get().explorer; createView(name, page, state); toast.success(`Saved “${name.trim()}”`, "Captured your current filters for that page."); }
    closeModal();
  };
  const remove = async (v: SavedView) => {
    if (await confirm({ title: `Delete “${v.name}”?`, description: "This removes the view for everyone it's shared with. This can't be undone.", confirmLabel: "Delete view", danger: true })) { deleteView(v.id); toast.success("View deleted"); }
  };

  return (
    <>
      <PageHeader title="Saved views" description="Bookmark any analysis with its filters and date range, then reopen it in one click. Views are saved in this browser."
        actions={<Gate permission="dashboards:create"><Button variant="primary" onClick={() => { setName(""); setCreating(true); }}><Plus className="size-4" /> Save current view</Button></Gate>} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs<Tab> label="Saved view filters" value={tab} onChange={setTab} className="flex-1"
          options={[{ value: "all", label: "All", count: count(() => true) }, { value: "favorites", label: "Favorites", count: count((v) => v.favorite) }, { value: "mine", label: "Created by me", count: count(mine) },
            { value: "shared", label: "Shared with me", count: count((v) => v.shared && !mine(v)) }, { value: "archived", label: "Archived", count: views.filter((v) => v.archived).length }]} />
        <SearchField value={query} onChange={setQuery} placeholder="Search views" label="Search saved views" className="sm:w-60" />
      </div>

      {visible.length === 0 ? (
        <Card className="mt-4"><EmptyState icon={tab === "archived" ? Archive : Bookmark} title={tab === "archived" ? "Nothing archived" : "No saved views found"}
          description={tab === "archived" ? "Archive a view to tuck it away without deleting it." : "Save the filters you use most from Analytics or the Data explorer and they'll show up here."}
          action={tab !== "archived" && can("dashboards:create") ? <Button variant="primary" onClick={() => setCreating(true)}>Save current view</Button> : undefined} /></Card>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((v) => {
            const editable = can("dashboards:edit") && (mine(v) || can("settings:edit"));
            return (
              <li key={v.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-[15px] font-semibold text-ink">{v.name}</h2>
                      <p className="mt-0.5 text-xs text-mute">{v.page === "analytics" ? "Analytics" : "Data explorer"}</p>
                    </div>
                    <div className="flex items-center">
                      <button type="button" onClick={() => toggleFavorite(v.id)} aria-pressed={v.favorite} aria-label={v.favorite ? `Remove ${v.name} from favorites` : `Add ${v.name} to favorites`} className="rounded-md p-1.5 text-faint hover:text-ink">
                        <Star className={cn("size-[18px]", v.favorite && "fill-gold text-gold")} />
                      </button>
                      <DropdownMenu label={`Actions for ${v.name}`}
                        trigger={(p) => <Button variant="ghost" size="icon-sm" {...p} aria-label={`Actions for ${v.name}`}><Ellipsis className="size-4" /></Button>}
                        entries={[
                          { label: "Open view", icon: ExternalLink, onSelect: () => open(v) },
                          ...(can("dashboards:create") ? [{ label: "Duplicate", icon: Copy, onSelect: () => { duplicateView(v.id); toast.success("View duplicated"); } }] : []),
                          ...(editable ? [
                            { label: "Rename", icon: Pencil, onSelect: () => { setName(v.name); setRenaming(v); } },
                            { label: v.shared ? "Stop sharing" : "Share with workspace", icon: Share2, onSelect: () => { toggleShared(v.id); toast.success(v.shared ? "No longer shared" : "Shared with the workspace"); } },
                            { label: v.archived ? "Restore" : "Archive", icon: v.archived ? ArchiveRestore : Archive, onSelect: () => toggleArchived(v.id) },
                          ] : []),
                          ...(can("dashboards:delete") && mine(v) ? [{ type: "separator" as const }, { label: "Delete", icon: Trash2, danger: true, onSelect: () => remove(v) }] : []),
                        ]} />
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-mute">{describe(v)}</p>
                  <div className="my-4 rounded-lg border border-line bg-raised px-3 pb-1 pt-3"><Preview v={v} /></div>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2"><Avatar name={ownerName(v.ownerId)} size="sm" /><span className="truncate text-xs text-mute">{ownerName(v.ownerId)}</span></div>
                    {v.shared && <Badge tone="info"><Share2 className="size-3" aria-hidden /> Shared</Badge>}
                  </div>
                  <Button size="sm" className="mt-4 w-full" onClick={() => open(v)}>Open view</Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={creating || !!renaming} onClose={closeModal} title={renaming ? "Rename view" : "Save current view"} description={renaming ? undefined : "Captures the filters and date range you last used on that page."} size="sm"
        footer={<><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={submit}>{renaming ? "Save name" : "Save view"}</Button></>}>
        <div className="space-y-4">
          <Field label="View name">
            {(id) => (<>
              <Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Q4 revenue by region" autoFocus aria-invalid={touched && !!err} aria-describedby={`${id}-e`} onKeyDown={(e) => e.key === "Enter" && submit()} />
              {touched && err && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{err}</p>}
            </>)}
          </Field>
          {!renaming && <Field label="Save filters from">{(id) => <Select id={id} value={page} onChange={(e) => setPage(e.target.value as ViewPage)}><option value="analytics">Analytics</option><option value="data-explorer">Data explorer</option></Select>}</Field>}
        </div>
      </Modal>
    </>
  );
}
