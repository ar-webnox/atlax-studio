"use client";

import { useMemo, useState } from "react";
import { Ellipsis, KeyRound, Mail, ShieldCheck, UserMinus, UserPlus, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DropdownMenu, type MenuEntry } from "@/components/ui/dropdown";
import { FilterSelect, SearchField } from "@/components/ui/filters";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm";
import { Gate, useCan, useSession } from "@/components/rbac";
import { assignableRoles, canManageMember, ROLES, ROLE_INFO, type Role } from "@/lib/rbac";
import { uid, useStore } from "@/lib/store";
import { addInvitation, invitationsStore, membersStore } from "@/lib/state/app";
import { logActivity } from "@/lib/state/activity";
import { useIntent } from "@/lib/state/intent";
import { toast } from "@/lib/state/toast";
import { pushNotification } from "@/lib/notifications-context";
import { email as emailRule, required, validate } from "@/lib/validators";
import type { Member, MemberStatus } from "@/lib/data/people";

const statusTone: Record<MemberStatus, Tone> = { Active: "pos", Away: "warn", Invited: "info", Suspended: "neg" };
const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function TeamView() {
  const confirm = useConfirm();
  const can = useCan();
  const { user, role: myRole } = useSession();
  const members = useStore(membersStore);
  const invites = useStore(invitationsStore);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [inviting, setInviting] = useState(false);
  const [changing, setChanging] = useState<Member | null>(null);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Analyst");
  const [newRole, setNewRole] = useState<Role>("Analyst");
  const [touched, setTouched] = useState(false);
  useIntent("invite", () => { if (can("team:create")) openInvite(); });

  const invitable = assignableRoles(myRole);
  const emailErr = validate(email, required("Email"), emailRule) ?? (members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase()) ? "That person is already a member." : invites.some((i) => i.email === email.trim().toLowerCase()) ? "That email already has a pending invitation." : null);

  const openInvite = () => { setEmail(""); setTouched(false); setInviteRole(invitable.includes("Analyst") ? "Analyst" : invitable[invitable.length - 1] ?? "Viewer"); setInviting(true); };
  const sendInvite = () => {
    setTouched(true);
    if (emailErr) return;
    addInvitation(email, inviteRole);
    logActivity("Invited member", `${email.trim()} as ${inviteRole}`, "Access");
    toast.success("Invitation sent", `${email.trim()} will join as ${inviteRole}. Demo only: no email is actually delivered.`);
    setInviting(false);
  };

  const manageable = (m: Member) => can("team:edit") && m.id !== user.id && canManageMember(myRole, m.role);
  const patch = (id: string, p: Partial<Member>) => membersStore.set((all) => all.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const applyRole = () => {
    if (!changing) return;
    patch(changing.id, { role: newRole });
    logActivity("Changed role", `${changing.name}: ${changing.role} to ${newRole}`, "Access", "Notice");
    pushNotification({ kind: "team", title: `${changing.name} is now ${newRole}`, body: `Role changed from ${changing.role} by ${user.name}.`, href: "/team" });
    toast.success(`${changing.name} is now ${newRole}`);
    setChanging(null);
  };
  const toggleSuspend = async (m: Member) => {
    const suspend = m.status !== "Suspended";
    if (suspend && !(await confirm({ title: `Suspend ${m.name}?`, description: "They lose access immediately but keep their history. You can reinstate them at any time.", confirmLabel: "Suspend member", danger: true }))) return;
    patch(m.id, { status: suspend ? "Suspended" : "Active" });
    logActivity(suspend ? "Suspended member" : "Reinstated member", m.name, "Access", suspend ? "Notice" : "Info");
    toast.success(suspend ? `${m.name} suspended` : `${m.name} reinstated`);
  };
  const removeMember = async (m: Member) => {
    if (!(await confirm({ title: `Remove ${m.name}?`, description: "They'll be removed from the workspace and lose all access. This can't be undone.", confirmLabel: "Remove member", danger: true }))) return;
    membersStore.set((all) => all.filter((x) => x.id !== m.id));
    logActivity("Removed member", m.name, "Access", "Notice");
    toast.success(`${m.name} removed`);
  };

  const rows = useMemo(() => members.filter((m) => (roleFilter === "all" || m.role === roleFilter) && `${m.name} ${m.email} ${m.team}`.toLowerCase().includes(query.toLowerCase())), [members, query, roleFilter]);

  const entries = (m: Member): MenuEntry[] => {
    const e: MenuEntry[] = [{ label: "Send message", icon: Mail, onSelect: () => toast.info(`Message to ${m.name}`, "Messaging isn't connected in this demo.") }];
    if (manageable(m)) {
      e.push({ label: "Change role", icon: ShieldCheck, onSelect: () => { setNewRole(assignableRoles(myRole).includes(m.role) ? m.role : assignableRoles(myRole)[0]); setChanging(m); } });
      e.push({ label: "Reset access", icon: KeyRound, onSelect: () => { logActivity("Reset access", m.name, "Security", "Notice"); toast.success(`Access reset for ${m.name}`, "Demo only."); } });
      e.push({ type: "separator" });
      e.push({ label: m.status === "Suspended" ? "Reinstate member" : "Suspend member", icon: UserX, danger: m.status !== "Suspended", onSelect: () => toggleSuspend(m) });
      if (can("team:delete")) e.push({ label: "Remove member", icon: UserMinus, danger: true, onSelect: () => removeMember(m) });
    }
    return e;
  };

  const columns: Column<Member>[] = [
    { key: "name", header: "Member", sortValue: (r) => r.name, cell: (r) => (<div className="flex items-center gap-3"><Avatar name={r.name} /><div className="min-w-0"><p className="truncate font-medium">{r.name}{r.id === user.id && <span className="ml-2 text-xs font-normal text-faint">you</span>}</p><p className="truncate text-xs text-mute">{r.email}</p></div></div>) },
    { key: "role", header: "Role", sortValue: (r) => r.role, cell: (r) => <Badge tone={r.role === "Owner" ? "gold" : "neutral"}>{r.role}</Badge> },
    { key: "team", header: "Team", hideBelow: "md", sortValue: (r) => r.team, cell: (r) => <span className="text-mute">{r.team}</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
    { key: "last", header: "Last active", hideBelow: "sm", cell: (r) => <span className="text-mute">{r.lastActive}</span> },
    { key: "actions", header: "Actions", align: "right", cell: (r) => <DropdownMenu label={`Actions for ${r.name}`} trigger={(p) => <Button variant="ghost" size="icon-sm" {...p} aria-label={`Actions for ${r.name}`}><Ellipsis className="size-4" /></Button>} entries={entries(r)} /> },
  ];

  const byTeam = Object.entries(members.reduce<Record<string, number>>((a, m) => ({ ...a, [m.team]: (a[m.team] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Team" description="Invite people, assign roles and keep access tidy as your organization grows."
        actions={<Gate permission="team:create"><Button variant="primary" onClick={openInvite}><UserPlus className="size-4" /> Invite member</Button></Gate>} />

      <section aria-label="Team summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total members" icon={Users} value={String(members.length)} delta={invites.length} deltaSuffix="" comparison="invitations pending" />
        <KpiCard label="Active" value={String(members.filter((m) => m.status === "Active").length)} delta={0} deltaSuffix="" comparison="signed in recently" />
        <KpiCard label="Pending invites" value={String(invites.length)} delta={0} deltaSuffix="" comparison="awaiting acceptance" />
        <KpiCard label="Admins and owners" icon={ShieldCheck} value={String(members.filter((m) => m.role === "Owner" || m.role === "Admin").length)} delta={0} deltaSuffix="" comparison="with elevated access" />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchField value={query} onChange={setQuery} placeholder="Search name, email or team" label="Search members" className="sm:w-72" />
            <FilterSelect label="Role" value={roleFilter} options={[...ROLES]} onChange={setRoleFilter} />
          </div>
          <DataTable caption="Team members" columns={columns} rows={rows} getRowId={(r) => r.id} pageSize={7}
            empty={<EmptyState icon={Users} title="No members found" description="Try another name or clear the role filter." action={<Button onClick={() => { setQuery(""); setRoleFilter("all"); }}>Clear filters</Button>} />} />
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title="Pending invitations" description="Invitations expire after 7 days." />
            {invites.length === 0 ? <p className="px-5 py-6 text-[13px] text-mute">No pending invitations.</p> : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {invites.map((i) => (
                  <li key={i.id} className="py-3">
                    <p className="truncate text-[13px] font-medium text-ink">{i.email}</p>
                    <p className="text-xs text-mute">{i.role} · sent {fmtDate(i.sentAt)}</p>
                    {can("team:create") && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => { invitationsStore.set((p) => p.map((x) => (x.id === i.id ? { ...x, sentAt: "2026-10-30" } : x))); toast.success("Invitation resent", i.email); }}>Resend</Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          membersStore.set((p) => [...p, { id: uid("m"), name: i.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), email: i.email, role: i.role, team: "New", status: "Active", lastActive: "Just now", location: "—" }]);
                          invitationsStore.set((p) => p.filter((x) => x.id !== i.id)); logActivity("Invitation accepted", i.email, "Access"); toast.success("Invitation accepted (simulated)", `${i.email} is now a member.`);
                        }}>Simulate accept</Button>
                        <Button size="sm" variant="danger" onClick={async () => { if (await confirm({ title: "Revoke invitation?", description: `${i.email} will no longer be able to join with this invitation.`, confirmLabel: "Revoke", danger: true })) { invitationsStore.set((p) => p.filter((x) => x.id !== i.id)); logActivity("Revoked invitation", i.email, "Access", "Notice"); toast.success("Invitation revoked"); } }}>Revoke</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Members by team" />
            <ul className="space-y-3 p-5">{byTeam.map(([t, n]) => <li key={t} className="flex items-center justify-between text-[13px]"><span className="text-mute">{t}</span><span className="tabular font-medium text-ink">{n}</span></li>)}</ul>
          </Card>
        </div>
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite a member" description="They'll get an email with a link to join. (Demo: no email is sent.)" size="sm"
        footer={<><Button variant="ghost" onClick={() => setInviting(false)}>Cancel</Button><Button variant="primary" onClick={sendInvite}>Send invite</Button></>}>
        <div className="space-y-4">
          <Field label="Work email">{(id) => (<>
            <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} placeholder="name@company.com" autoFocus aria-invalid={touched && !!emailErr} aria-describedby={`${id}-e`} onKeyDown={(e) => e.key === "Enter" && sendInvite()} />
            {touched && emailErr && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{emailErr}</p>}</>)}</Field>
          <Field label="Role" hint={ROLE_INFO[inviteRole]}>{(id) => <Select id={id} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>{invitable.map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        </div>
      </Modal>

      <Modal open={!!changing} onClose={() => setChanging(null)} title={`Change role for ${changing?.name ?? ""}`} description={`Currently ${changing?.role}. You can assign roles below your own (${myRole}).`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setChanging(null)}>Cancel</Button><Button variant="primary" disabled={newRole === changing?.role} onClick={applyRole}>Update role</Button></>}>
        <Field label="New role" hint={ROLE_INFO[newRole]}>{(id) => <Select id={id} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>{assignableRoles(myRole).map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        <p className="mt-4 text-xs text-faint">Demo permissions: this change is stored in your browser, not enforced by a server.</p>
      </Modal>
    </>
  );
}
