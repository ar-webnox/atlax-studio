"use client";

import { useState } from "react";
import { Eye, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/form";
import { useConfirm } from "@/components/ui/confirm";
import { useCan, useSession } from "@/components/rbac";
import { cn } from "@/lib/cn";
import { ACTIONS, DEFAULT_PERMISSIONS, RESOURCES, ROLES, ROLE_INFO, ROLE_RANK, DEMO_AUTH_NOTICE, type Permission, type PermissionMap, type Role } from "@/lib/rbac";
import { useStore } from "@/lib/store";
import { membersStore, permissionsStore, sessionStore } from "@/lib/state/app";
import { logActivity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";

export function RolesView() {
  const confirm = useConfirm();
  const can = useCan();
  const { role: myRole } = useSession();
  const saved = useStore(permissionsStore);
  const members = useStore(membersStore);
  const [selected, setSelected] = useState<Role>("Analyst");
  const [draft, setDraft] = useState<PermissionMap | null>(null);
  const map = draft ?? saved;
  const dirty = draft !== null;
  const locked = selected === "Owner";
  // Only people with roles:edit may edit and never a role at or above their own rank.
  const editable = can("roles:edit") && !locked && ROLE_RANK[myRole] > ROLE_RANK[selected];
  const enabled = new Set(map[selected]);
  const total = RESOURCES.reduce((n, r) => n + r.actions.length, 0);
  const on = (p: Permission) => selected === "Owner" || enabled.has(p);

  const set = (p: Permission, v: boolean) => {
    const base = draft ?? saved;
    const list = new Set(base[selected]);
    if (v) list.add(p); else list.delete(p);
    // Keeping "view" implied: removing view removes the rest of that resource; adding any action adds view.
    const [res, action] = p.split(":");
    if (!v && action === "view") RESOURCES.find((r) => r.id === res)?.actions.forEach((a) => list.delete(`${res}:${a}` as Permission));
    if (v && action !== "view") list.add(`${res}:view` as Permission);
    setDraft({ ...base, [selected]: [...list] as Permission[] });
  };

  const save = () => {
    if (!draft) return;
    permissionsStore.set(draft);
    logActivity("Updated permissions", `${selected} role`, "Access", "Notice");
    toast.success(`${selected} permissions saved`, "Demo only: stored in this browser.");
    setDraft(null);
  };
  const reset = async () => {
    if (await confirm({ title: "Restore default permissions?", description: "Every role goes back to its built-in permissions. Your customizations will be lost.", confirmLabel: "Restore defaults", danger: true })) {
      permissionsStore.set(DEFAULT_PERMISSIONS); setDraft(null); logActivity("Restored default permissions", "All roles", "Access", "Notice"); toast.success("Defaults restored");
    }
  };

  return (
    <>
      <PageHeader title="Roles & permissions" description="Decide what each role can see and change. In this build, changes affect what the interface shows in your browser."
        actions={<>
          {can("roles:edit") && <Button variant="ghost" onClick={reset}>Restore defaults</Button>}
          <Button disabled={!dirty} onClick={() => setDraft(null)}>Discard changes</Button>
          <Button variant="primary" disabled={!dirty || !editable} onClick={save}>Save changes</Button>
        </>} />

      <div role="note" className="mb-4 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] leading-5 text-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
        <p><strong className="font-semibold">Not real security.</strong> {DEMO_AUTH_NOTICE} A production version must enforce every permission on the server.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader title="Roles" />
          <ul className="space-y-1 p-3" role="listbox" aria-label="Roles">
            {ROLES.map((r) => (
              <li key={r} role="presentation">
                <button type="button" role="option" aria-selected={r === selected} onClick={() => setSelected(r)}
                  className={cn("flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors", r === selected ? "border-gold/40 bg-gold-soft/50" : "border-transparent hover:bg-raised")}>
                  <ShieldCheck className={cn("mt-0.5 size-4 shrink-0", r === selected ? "text-gold" : "text-faint")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">{r}<span className="text-xs font-normal tabular text-mute">{members.filter((m) => m.role === r).length}</span></span>
                    <span className="mt-0.5 block text-xs leading-5 text-mute">{ROLE_INFO[r]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title={`${selected} permissions`} description={`${selected === "Owner" ? total : enabled.size} of ${total} permissions enabled`}
            action={<>
              {locked && <Badge tone="gold"><Lock className="size-3" aria-hidden /> Locked</Badge>}
              <Button size="sm" onClick={() => { sessionStore.set((s) => ({ ...s, viewAs: selected })); toast.info(`Previewing as ${selected}`, "Browse the app to see what this role can do. Switch back from the account menu."); }}><Eye className="size-4" /> Preview as {selected}</Button>
            </>} />
          <div className="scroll-thin mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <caption className="sr-only">Permissions for the {selected} role</caption>
              <thead><tr className="border-y border-line bg-raised text-[13px] text-mute">
                <th scope="col" className="px-5 py-2.5 text-left font-medium">Resource</th>
                {ACTIONS.map((a) => <th key={a} scope="col" className="px-3 py-2.5 text-center font-medium capitalize">{a}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {RESOURCES.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">{r.label}{r.hint && <span className="block text-xs font-normal text-faint">{r.hint}</span>}</th>
                    {ACTIONS.map((a) => {
                      const p = `${r.id}:${a}` as Permission;
                      return (
                        <td key={a} className="px-3 py-3 text-center">
                          {r.actions.includes(a) ? <Switch checked={on(p)} disabled={!editable} label={`${selected} can ${a} ${r.label.toLowerCase()}`} onChange={(v) => set(p, v)} /> : <span className="text-faint" aria-hidden>·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-mute">
            {locked ? "The Owner role always has every permission so a workspace can never be locked out."
              : !can("roles:edit") ? `The ${myRole} role can view permissions but not change them.`
              : ROLE_RANK[myRole] <= ROLE_RANK[selected] ? "You can only edit roles that rank below your own." : "Turning on any action also turns on View for that resource."}
          </p>
        </Card>
      </div>
    </>
  );
}
