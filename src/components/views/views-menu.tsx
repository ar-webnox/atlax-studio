"use client";

import { useState } from "react";
import { Bookmark, Check, Plus, Star } from "lucide-react";
import { createView, applyView, viewsStore, type SavedView, type ViewPage } from "@/lib/state/views";
import { useStore } from "@/lib/store";
import { useIntent } from "@/lib/state/intent";
import { toast } from "@/lib/state/toast";
import { required, minLength, maxLength, validate } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { Popover } from "@/components/ui/popover";
import { useCan } from "@/components/rbac";

export function SaveViewModal({ open, onClose, page, getState, defaultName = "" }: { open: boolean; onClose: () => void; page: ViewPage; getState: () => SavedView["state"]; defaultName?: string }) {
  const [name, setName] = useState(defaultName);
  const [touched, setTouched] = useState(false);
  const error = validate(name, required("View name"), minLength("View name", 3), maxLength("View name", 60));
  const close = () => { setTouched(false); onClose(); };
  const save = () => {
    setTouched(true);
    if (error) return;
    createView(name, page, getState());
    toast.success(`Saved “${name.trim()}”`, "Find it under Saved views or in the Views menu.");
    setName("");
    close();
  };
  return (
    <Modal open={open} onClose={close} title="Save current view" description="Saves your filters, date range and layout so you can come back to them." size="sm"
      footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" onClick={save}>Save view</Button></>}>
      <Field label="View name">
        {(id) => (
          <>
            <Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Q4 revenue by region" autoFocus aria-invalid={touched && !!error} aria-describedby={`${id}-err`}
              onKeyDown={(e) => e.key === "Enter" && save()} />
            {touched && error && <p id={`${id}-err`} role="alert" className="text-xs text-neg">{error}</p>}
          </>
        )}
      </Field>
    </Modal>
  );
}

/** Menu of saved views for a page, plus a "Save current view" action. */
export function ViewsMenu({ page, getState }: { page: ViewPage; getState: () => SavedView["state"] }) {
  const views = useStore(viewsStore).filter((v) => v.page === page).sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const can = useCan();
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  useIntent("save-view", () => { if (can("dashboards:create")) setSaving(true); });

  return (
    <>
      <Popover label="Saved views" role="menu" panelClassName="w-72 p-1.5"
        trigger={(p) => (
          <Button {...p}><Bookmark className="size-4" /> Views{views.length > 0 && <span className="rounded-md bg-sunken px-1.5 text-xs tabular text-mute">{views.length}</span>}</Button>
        )}>
        {(close) => (
          <>
            {views.length === 0 && <p className="px-2.5 py-3 text-[13px] text-mute">No saved views for this page yet.</p>}
            {views.map((v) => (
              <button key={v.id} type="button" role="menuitemradio" aria-checked={v.id === activeId}
                onClick={() => { applyView(v); setActiveId(v.id); toast.info(`Applied “${v.name}”`); close(); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised">
                <Star className={`size-3.5 shrink-0 ${v.favorite ? "fill-gold text-gold" : "text-faint"}`} aria-hidden />
                <span className="flex-1 truncate">{v.name}</span>
                {v.id === activeId && <Check className="size-4 text-gold" aria-hidden />}
              </button>
            ))}
            {can("dashboards:create") && (
              <>
                <div role="separator" className="my-1.5 h-px bg-line" />
                <button type="button" role="menuitem" onClick={() => { close(); setSaving(true); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised">
                  <Plus className="size-4 text-faint" aria-hidden /> Save current view
                </button>
              </>
            )}
          </>
        )}
      </Popover>
      <SaveViewModal open={saving} onClose={() => setSaving(false)} page={page} getState={getState} />
    </>
  );
}

