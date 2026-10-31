"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Copy, KeyRound, Monitor, Moon, Smartphone, Sun, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Progress, Select, Switch } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm";
import { useCan, useSession } from "@/components/rbac";
import { cn } from "@/lib/cn";
import { uid, useStore } from "@/lib/store";
import { apiKeysStore, membersStore, prefsStore, setPrefs, workspacesStore, type ApiKey } from "@/lib/state/app";
import { intentStore } from "@/lib/state/intent";
import { logActivity } from "@/lib/state/activity";
import { toast } from "@/lib/state/toast";
import { email as emailRule, maxLength, minLength, required, slug as slugRule, validate } from "@/lib/validators";

type Tab = "profile" | "workspace" | "appearance" | "security" | "billing" | "api";

function Row({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (<div className="flex items-center justify-between gap-6 py-4"><div className="min-w-0"><p className="text-sm font-medium text-ink">{title}</p><p className="text-[13px] leading-5 text-mute">{detail}</p></div><div className="shrink-0">{children}</div></div>);
}
const Err = ({ id, show, msg }: { id: string; show: boolean; msg: string | null }) => (show && msg ? <p id={id} role="alert" className="text-xs text-neg">{msg}</p> : null);

function ProfileTab() {
  const { user, role } = useSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [title, setTitle] = useState(user.title ?? "");
  const [touched, setTouched] = useState(false);
  const nameErr = validate(name, required("Name"), minLength("Name", 2), maxLength("Name", 60));
  const emailErr = validate(email, required("Email"), emailRule);
  const dirty = name !== user.name || email !== user.email || title !== (user.title ?? "");
  const save = () => {
    setTouched(true);
    if (nameErr || emailErr) return;
    membersStore.set((all) => all.map((m) => (m.id === user.id ? { ...m, name: name.trim(), email: email.trim(), title: title.trim() } : m)));
    logActivity("Updated profile", name.trim(), "Settings");
    toast.success("Profile saved");
    setTouched(false);
  };
  return (
    <Card>
      <CardHeader title="Your profile" description="How you appear to teammates." />
      <CardBody className="grid gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 sm:col-span-2"><Avatar name={name || user.name} size="lg" /><div><p className="text-sm font-medium text-ink">{name || user.name}</p><p className="text-[13px] text-mute">Demo role: <Badge tone="gold">{role}</Badge></p></div></div>
        <Field label="Full name">{(id) => (<><Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!nameErr} aria-describedby={`${id}-e`} /><Err id={`${id}-e`} show={touched} msg={nameErr} /></>)}</Field>
        <Field label="Email">{(id) => (<><Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!emailErr} aria-describedby={`${id}-e`} /><Err id={`${id}-e`} show={touched} msg={emailErr} /></>)}</Field>
        <Field label="Job title (optional)">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Head of Analytics" />}</Field>
      </CardBody>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4"><Button disabled={!dirty} onClick={() => { setName(user.name); setEmail(user.email); setTitle(user.title ?? ""); setTouched(false); }}>Reset</Button><Button variant="primary" disabled={!dirty} onClick={save}>Save profile</Button></div>
    </Card>
  );
}

function WorkspaceTab() {
  const confirm = useConfirm();
  const can = useCan();
  const ws = useStore(workspacesStore);
  const active = ws.list.find((w) => w.id === ws.activeId) ?? ws.list[0];
  const editable = can("settings:edit");
  const [name, setName] = useState(active.name);
  const [slug, setSlug] = useState(active.slug);
  const [tz, setTz] = useState(active.timezone);
  const [fy, setFy] = useState(active.fiscalStart);
  const [touched, setTouched] = useState(false);
  useEffect(() => { setName(active.name); setSlug(active.slug); setTz(active.timezone); setFy(active.fiscalStart); setTouched(false); }, [active.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const nameErr = validate(name, required("Workspace name"), minLength("Workspace name", 3), maxLength("Workspace name", 50));
  const slugErr = validate(slug, required("URL"), slugRule) ?? (ws.list.some((w) => w.id !== active.id && w.slug === slug) ? "That URL is already used by another workspace." : null);
  const save = () => {
    setTouched(true);
    if (nameErr || slugErr) return;
    workspacesStore.set((p) => ({ ...p, list: p.list.map((w) => (w.id === active.id ? { ...w, name: name.trim(), slug, timezone: tz, fiscalStart: fy } : w)) }));
    logActivity("Edited workspace", name.trim(), "Settings"); toast.success("Workspace saved");
  };
  const del = async (id: string, n: string) => {
    if (await confirm({ title: `Delete workspace “${n}”?`, description: "Its members, saved views and settings are removed. This can't be undone. (Demo: the shared demo data is not affected.)", confirmLabel: "Delete workspace", danger: true })) {
      workspacesStore.set((p) => { const list = p.list.filter((w) => w.id !== id); return { list, activeId: p.activeId === id ? list[0].id : p.activeId }; });
      logActivity("Deleted workspace", n, "Settings", "Critical"); toast.success(`“${n}” deleted`);
    }
  };
  return (
    <>
      <Card>
        <CardHeader title="Workspace" description="How this workspace appears to everyone in it." />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Workspace name">{(id) => (<><Input id={id} disabled={!editable} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!nameErr} aria-describedby={`${id}-e`} /><Err id={`${id}-e`} show={touched} msg={nameErr} /></>)}</Field>
          <Field label="Workspace URL" hint="Used in shared links. Lowercase letters, numbers and hyphens.">{(id) => (<><Input id={id} disabled={!editable} value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!slugErr} aria-describedby={`${id}-e`} /><Err id={`${id}-e`} show={touched} msg={slugErr} /></>)}</Field>
          <Field label="Time zone">{(id) => <Select id={id} disabled={!editable} value={tz} onChange={(e) => setTz(e.target.value)}><option value="utc">UTC</option><option value="pkt">Pakistan Standard Time (UTC+5)</option><option value="cet">Central European Time (UTC+1)</option><option value="est">Eastern Time (UTC−5)</option></Select>}</Field>
          <Field label="Fiscal year starts">{(id) => <Select id={id} disabled={!editable} value={fy} onChange={(e) => setFy(e.target.value)}>{["January", "April", "July", "October"].map((m) => <option key={m} value={m.toLowerCase().slice(0, 3)}>{m}</option>)}</Select>}</Field>
        </CardBody>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="text-xs text-mute">{editable ? "" : "Your role can view but not change workspace settings."}</p>
          <Button variant="primary" disabled={!editable} onClick={save}>Save changes</Button>
        </div>
      </Card>
      <Card>
        <CardHeader title="All workspaces" description="Switch from the sidebar. Only the Owner can delete a workspace." />
        <ul className="mt-2 divide-y divide-line px-5 pb-2">
          {ws.list.map((w) => (
            <li key={w.id} className="flex items-center gap-3 py-3">
              <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-raised font-display text-sm font-semibold text-gold">{w.name[0]}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-ink">{w.name}</p><p className="text-xs text-mute">{w.plan} · /{w.slug}</p></div>
              {w.id === ws.activeId ? <Badge tone="gold">Current</Badge> : <Button size="sm" onClick={() => { workspacesStore.set((p) => ({ ...p, activeId: w.id })); toast.info(`Switched to ${w.name}`); }}>Switch</Button>}
              <PermissionDelete disabled={ws.list.length <= 1} onClick={() => del(w.id, w.name)} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
function PermissionDelete({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const { actualRole, role } = useSession();
  if (role !== "Owner" || actualRole !== "Owner") return null;
  return <Button size="icon-sm" variant="ghost" aria-label="Delete workspace" disabled={disabled} onClick={onClick}><Trash2 className="size-4 text-neg" /></Button>;
}

function SecurityTab() {
  const prefs = useStore(prefsStore);
  const can = useCan();
  const editable = can("settings:edit");
  const change = (patch: Partial<typeof prefs>, msg: string) => { setPrefs(patch); logActivity("Changed security setting", msg, "Security", "Notice"); toast.success(msg); };
  return (
    <>
      <Card>
        <CardHeader title="Sign-in and access" description={editable ? "These are saved in your browser (demo)." : "Your role can view but not change security settings."} />
        <CardBody className="divide-y divide-line py-1">
          <Row title="Require two-factor authentication" detail="Every member must verify with an authenticator app."><Switch checked={prefs.twoFa} disabled={!editable} onChange={(v) => change({ twoFa: v }, v ? "Two-factor requirement turned on" : "Two-factor requirement turned off")} label="Require two-factor authentication" /></Row>
          <Row title="Single sign-on (SAML)" detail="Let members sign in with your identity provider."><Switch checked={prefs.sso} disabled={!editable} onChange={(v) => change({ sso: v }, v ? "SSO enabled (demo)" : "SSO disabled")} label="Single sign-on" /></Row>
          <Row title="Session length" detail="Members are signed out after this much inactivity."><div className="w-36"><Select aria-label="Session length" disabled={!editable} value={prefs.sessionHours} onChange={(e) => change({ sessionHours: e.target.value }, `Session length set to ${e.target.value} h`)}><option value="1">1 hour</option><option value="8">8 hours</option><option value="24">24 hours</option></Select></div></Row>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Active sessions" description="Devices currently signed in to your account (illustrative)." />
        <ul className="divide-y divide-line px-5 pb-2 pt-2">
          {([["Chrome on macOS", "Lagos, Nigeria", "This device", Monitor], ["Safari on iPhone", "Lagos, Nigeria", "2 hr ago", Smartphone]] as const).map(([d, l, t, Icon]) => (
            <li key={d} className="flex items-center gap-3 py-3"><Icon className="size-5 text-faint" aria-hidden /><div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-ink">{d}</p><p className="text-xs text-mute">{l}</p></div>
              {t === "This device" ? <Badge tone="pos">This device</Badge> : <Button size="sm" variant="danger" onClick={() => toast.info("Session signed out (demo)")}>Sign out</Button>}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function ApiKeysTab() {
  const confirm = useConfirm();
  const can = useCan();
  const keys = useStore(apiKeysStore);
  const editable = can("settings:edit");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const err = validate(name, required("Key name"), minLength("Key name", 3), maxLength("Key name", 40));

  const create = () => {
    setTouched(true);
    if (err) return;
    const secret = `atl_demo_${uid("").replace(/[^a-z0-9]/g, "")}${Math.random().toString(36).slice(2, 12)}`;
    apiKeysStore.set((p) => [{ id: uid("k"), name: name.trim(), prefix: `${secret.slice(0, 13)}…`, created: "2026-10-31", used: "Never" }, ...p]);
    logActivity("Created API key", name.trim(), "Security", "Notice");
    setCreated(secret); setCreating(false); setName(""); setTouched(false);
  };
  const revoke = async (k: ApiKey) => { if (await confirm({ title: `Revoke “${k.name}”?`, description: "Anything using this key stops working immediately.", confirmLabel: "Revoke key", danger: true })) { apiKeysStore.set((p) => p.filter((x) => x.id !== k.id)); logActivity("Revoked API key", k.name, "Security", "Notice"); toast.success("Key revoked"); } };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); } catch { toast.error("Couldn't copy", "Select the text and copy it manually."); } };

  const cols: Column<ApiKey>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="flex items-center gap-2 font-medium"><KeyRound className="size-4 text-faint" aria-hidden />{r.name}</span> },
    { key: "prefix", header: "Key", hideBelow: "sm", cell: (r) => <code className="text-xs text-mute">{r.prefix}</code> },
    { key: "created", header: "Created", hideBelow: "md", cell: (r) => <span className="text-mute">{r.created}</span> },
    { key: "used", header: "Last used", hideBelow: "lg", cell: (r) => <span className="text-mute">{r.used}</span> },
    { key: "a", header: "Actions", align: "right", cell: (r) => <div className="flex justify-end gap-2"><Button size="sm" onClick={() => copy(r.id)}><Copy className="size-4" /> Copy ID</Button>{editable && <Button size="sm" variant="danger" onClick={() => revoke(r)}>Revoke</Button>}</div> },
  ];
  return (
    <>
      <Card>
        <CardHeader title="API keys" description="Demo keys only. They don't authenticate against any real API." action={editable ? <Button variant="primary" size="sm" onClick={() => setCreating(true)}>Create key</Button> : undefined} />
        <div className="mt-4"><DataTable caption="API keys" columns={cols} rows={keys} getRowId={(r) => r.id} /></div>
      </Card>
      <Modal open={creating} onClose={() => setCreating(false)} title="Create API key" size="sm" footer={<><Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" onClick={create}>Create key</Button></>}>
        <Field label="Key name">{(id) => (<><Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Reporting service" autoFocus aria-invalid={touched && !!err} aria-describedby={`${id}-e`} onKeyDown={(e) => e.key === "Enter" && create()} /><Err id={`${id}-e`} show={touched} msg={err} /></>)}</Field>
      </Modal>
      <Modal open={!!created} onClose={() => setCreated(null)} title="Your new demo key" description="Copy it now. For real keys, the secret is shown only once." size="sm" footer={<Button variant="primary" onClick={() => setCreated(null)}>Done</Button>}>
        <div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-lg border border-line bg-sunken p-3 text-xs text-ink">{created}</code><Button size="icon" aria-label="Copy key" onClick={() => created && copy(created)}><Copy className="size-4" /></Button></div>
      </Modal>
    </>
  );
}

export function SettingsView() {
  const can = useCan();
  const { theme, setTheme } = useTheme();
  const prefs = useStore(prefsStore);
  const members = useStore(membersStore);
  const intent = useStore(intentStore);
  const { user } = useSession();
  const wsState = useStore(workspacesStore);
  const activeWs = wsState.list.find((w) => w.id === wsState.activeId) ?? wsState.list[0];
  const [tab, setTab] = useState<Tab>("profile");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (intent?.startsWith("settings:")) { setTab(intent.slice(9) as Tab); intentStore.set(null); }
  }, [intent]);

  const tabs: { value: Tab; label: string; show: boolean }[] = [
    { value: "profile", label: "Profile", show: true }, { value: "workspace", label: "Workspace", show: can("settings:view") }, { value: "appearance", label: "Appearance", show: true },
    { value: "security", label: "Security", show: can("settings:view") }, { value: "billing", label: "Billing", show: can("billing:view") }, { value: "api", label: "API keys", show: can("settings:view") },
  ];
  const visible = tabs.filter((t) => t.show);
  const current = visible.some((t) => t.value === tab) ? tab : "profile";

  const themes = [
    { value: "light", label: "Light", icon: Sun, bg: "#f5f4f0", fg: "#16161a", acc: "#a07a2c" },
    { value: "dark", label: "Dark", icon: Moon, bg: "#0c0c0e", fg: "#ededf0", acc: "#c8a45c" },
    { value: "system", label: "System", icon: Monitor, bg: "linear-gradient(90deg,#f5f4f0 50%,#0c0c0e 50%)", fg: "#888", acc: "#a07a2c" },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, workspace, appearance, security and developer access. Changes are saved in this browser." />
      <Tabs<Tab> label="Settings sections" value={current} onChange={setTab} options={visible.map((t) => ({ value: t.value, label: t.label }))} />
      <div className="mt-6 max-w-4xl space-y-4">
        {/* Keyed so forms re-initialise when saved data finishes loading from local storage. */}
        {current === "profile" && <ProfileTab key={`${user.id}|${user.name}|${user.email}|${user.title ?? ""}`} />}
        {current === "workspace" && <WorkspaceTab key={`${activeWs.id}|${activeWs.name}|${activeWs.slug}|${activeWs.timezone}|${activeWs.fiscalStart}`} />}
        {current === "appearance" && (
          <Card>
            <CardHeader title="Appearance" description="Choose how ATLAX Studio looks on this device." />
            <CardBody>
              <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
                {themes.map((t) => {
                  const on = mounted && theme === t.value;
                  return (
                    <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => setTheme(t.value)} className={cn("rounded-xl border p-3 text-left transition-colors", on ? "border-gold ring-2 ring-gold/30" : "border-line hover:border-line-strong")}>
                      <span className="block h-16 rounded-lg border border-line p-2.5" style={{ background: t.bg }} aria-hidden><span className="block h-1.5 w-1/2 rounded-full" style={{ background: t.fg, opacity: 0.7 }} /><span className="mt-2 block h-1.5 w-1/3 rounded-full" style={{ background: t.acc }} /></span>
                      <span className="mt-2.5 flex items-center gap-2 text-[13px] font-medium text-ink"><t.icon className="size-4 text-faint" aria-hidden />{t.label}{on && <Check className="ml-auto size-4 text-gold" aria-hidden />}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 divide-y divide-line border-t border-line pt-1">
                <Row title="Compact tables" detail="Show more rows per screen by tightening row height."><Switch checked={prefs.density === "compact"} onChange={(v) => setPrefs({ density: v ? "compact" : "comfortable" })} label="Compact tables" /></Row>
              </div>
            </CardBody>
          </Card>
        )}
        {current === "security" && <SecurityTab />}
        {current === "billing" && (
          <Card>
            <CardHeader title="Enterprise plan" description="Demo plan. No payment method is connected." action={<Badge tone="gold">Current plan</Badge>} />
            <CardBody className="grid gap-6 sm:grid-cols-3">
              {([["Seats", `${members.length} of 25`, Math.round((members.length / 25) * 100)], ["Data storage", "1.36 TB of 2 TB", 68], ["Queries this month", "6.2M of 10M", 62]] as const).map(([l, v, p]) => (
                <div key={l}><p className="text-[13px] text-mute">{l}</p><p className="mt-1 font-display text-lg font-semibold tabular text-ink">{v}</p><div className="mt-2"><Progress value={p} label={l} /></div></div>
              ))}
            </CardBody>
            <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4"><Button onClick={() => toast.info("No invoices in the demo")}>View invoices</Button>{can("billing:edit") && <Button variant="primary" onClick={() => toast.info("Plan changes aren't connected in the demo")}>Change plan</Button>}</div>
          </Card>
        )}
        {current === "api" && <ApiKeysTab />}
      </div>
    </>
  );
}
