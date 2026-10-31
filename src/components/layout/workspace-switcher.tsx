"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore, uid } from "@/lib/store";
import { membersStore, workspacesStore } from "@/lib/state/app";
import { logActivity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";
import { required, minLength, validate } from "@/lib/validators";
import { Popover } from "@/components/ui/popover";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useCan } from "@/components/rbac";

export function WorkspaceSwitcher({ compact }: { compact?: boolean }) {
  const ws = useStore(workspacesStore);
  const members = useStore(membersStore);
  const can = useCan();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const active = ws.list.find((w) => w.id === ws.activeId) ?? ws.list[0];
  const error = validate(name, required("Workspace name"), minLength("Workspace name", 3));

  const create = () => {
    setTouched(true);
    if (error) return;
    const id = uid("w");
    workspacesStore.set((p) => ({ activeId: id, list: [...p.list, { id, name: name.trim(), slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), plan: "Business", timezone: "utc", fiscalStart: "jan" }] }));
    logActivity("Created workspace", name.trim(), "Settings");
    toast.success(`Workspace “${name.trim()}” created`, "You're now working in it. Demo data is shared across workspaces.");
    setCreating(false); setName(""); setTouched(false);
  };

  return (
    <>
      <Popover
        label="Switch workspace" role="menu" align="start" className="min-w-0 flex-1"
        panelClassName="w-64 p-1.5 max-sm:w-[min(16rem,calc(100vw-2rem))]"
        trigger={(p) => (
          <button type="button" {...p} className={cn("flex w-full items-center gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-line hover:bg-raised", compact && "justify-center")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-sm font-semibold text-on-gold">{active.name[0]}</span>
            {!compact && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{active.name}</span>
                  <span className="block truncate text-xs text-mute">{active.plan} plan</span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-faint" aria-hidden />
              </>
            )}
            {compact && <span className="sr-only">Workspace: {active.name}</span>}
          </button>
        )}
      >
        {(close) => (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-xs text-faint">Workspaces</p>
            {ws.list.map((w) => (
              <button key={w.id} type="button" role="menuitemradio" aria-checked={w.id === ws.activeId}
                onClick={() => { workspacesStore.set((p) => ({ ...p, activeId: w.id })); if (w.id !== ws.activeId) toast.info(`Switched to ${w.name}`, "Demo data is the same in every workspace."); close(); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none hover:bg-raised focus-visible:bg-raised">
                <span className="flex size-7 items-center justify-center rounded-md border border-line bg-sunken font-display text-xs font-semibold text-ink">{w.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{w.name}</span>
                  <span className="block text-xs text-mute">{w.id === "w1" ? `${members.length} members` : w.plan}</span>
                </span>
                {w.id === ws.activeId && <Check className="size-4 text-gold" aria-hidden />}
              </button>
            ))}
            {can("settings:edit") && (
              <>
                <div role="separator" className="my-1.5 h-px bg-line" />
                <button type="button" role="menuitem" onClick={() => { close(); setCreating(true); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised">
                  <Plus className="size-4 text-faint" aria-hidden /> Create workspace
                </button>
              </>
            )}
          </>
        )}
      </Popover>
      <Modal open={creating} onClose={() => { setCreating(false); setTouched(false); }} title="Create workspace" description="Workspaces keep data, members and billing separate." size="sm"
        footer={<><Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" onClick={create}>Create workspace</Button></>}>
        <Field label="Workspace name" hint="You can change this later in Settings.">
          {(id) => (
            <>
              <Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Northwind Analytics" autoFocus aria-invalid={touched && !!error} aria-describedby={`${id}-err`} />
              {touched && error && <p id={`${id}-err`} role="alert" className="text-xs text-neg">{error}</p>}
            </>
          )}
        </Field>
      </Modal>
    </>
  );
}
