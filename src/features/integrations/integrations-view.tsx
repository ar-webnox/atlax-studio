"use client";

import { useMemo, useState } from "react";
import { Check, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { SearchField } from "@/components/ui/filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { useConfirm } from "@/components/ui/confirm";
import { useCan } from "@/components/rbac";
import { useStore } from "@/lib/store";
import { configureIntegration, connectIntegration, disconnectIntegration, integrationCatalog, integrationsStore, type IntegrationCategory, type IntegrationDef } from "@/lib/state/integrations";
import { pushNotification } from "@/lib/notifications-context";
import { toast } from "@/lib/state/toast";
import { minLength, required, validate } from "@/lib/validators";

type Tab = "all" | IntegrationCategory;
const SYNC = [["15m", "Every 15 minutes"], ["1h", "Every hour"], ["6h", "Every 6 hours"], ["24h", "Daily"]] as const;
const fmt = (iso?: string) => (iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");

export function IntegrationsView() {
  const confirm = useConfirm();
  const can = useCan();
  const states = useStore(integrationsStore);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState<IntegrationDef | null>(null);
  const [managing, setManaging] = useState<IntegrationDef | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const editable = can("integrations:edit");
  const visible = useMemo(() => integrationCatalog.filter((i) => (tab === "all" || i.category === tab) && i.name.toLowerCase().includes(query.toLowerCase())), [tab, query]);
  const connected = integrationCatalog.filter((i) => states[i.id]?.connected).length;

  const fieldErr = connecting ? validate(value, required(connecting.field.label), minLength(connecting.field.label, 3), (v) => (connecting.field.kind === "url" && !/^https:\/\/\S+\.\S+/.test(v.trim()) ? "Enter a full https:// URL." : null)) : null;

  const connect = () => {
    setTouched(true);
    if (fieldErr || !connecting) return;
    setBusy(true);
    const def = connecting;
    setTimeout(() => {
      connectIntegration(def.id, "Configured (demo)");
      pushNotification({ kind: "system", title: `${def.name} connected`, body: "Demo connection. No credentials were sent or stored.", href: "/integrations" });
      toast.success(`${def.name} connected`, "This is a simulated connection.");
      setBusy(false); setConnecting(null); setValue(""); setTouched(false);
    }, 1100);
  };
  const disconnect = async (def: IntegrationDef) => {
    if (await confirm({ title: `Disconnect ${def.name}?`, description: "Syncing stops. Dashboards that use it keep their last values until you reconnect.", confirmLabel: "Disconnect", danger: true })) {
      disconnectIntegration(def.id); setManaging(null); toast.success(`${def.name} disconnected`);
    }
  };
  const mState = managing ? states[managing.id] : null;

  return (
    <>
      <PageHeader title="Integrations" description={`${connected} of ${integrationCatalog.length} integrations connected. Connections are simulated in this build: no credentials leave your browser and no data is synced.`} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs<Tab> label="Integration categories" value={tab} onChange={setTab} className="flex-1"
          options={[{ value: "all", label: "All" }, { value: "Data sources", label: "Data sources" }, { value: "Communication", label: "Communication" }, { value: "Engineering", label: "Engineering" }, { value: "Business", label: "Business" }]} />
        <SearchField value={query} onChange={setQuery} placeholder="Search integrations" label="Search integrations" className="sm:w-60" />
      </div>

      {visible.length === 0 ? (
        <Card className="mt-4"><EmptyState icon={PlugZap} title="No integrations found" description="Try a different name or request a new integration from support." /></Card>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((i) => {
            const st = states[i.id];
            return (
              <li key={i.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-raised font-display text-base font-semibold text-gold" aria-hidden>{i.name[0]}</span>
                    <div className="min-w-0 flex-1"><h2 className="font-display text-[15px] font-semibold text-ink">{i.name}</h2><p className="text-xs text-mute">{i.category}</p></div>
                    {st?.connected && <Badge tone="pos"><Check className="size-3" aria-hidden /> Connected</Badge>}
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-mute">{i.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs text-faint">{st?.connected ? `Since ${fmt(st.connectedAt)} · ${SYNC.find((s) => s[0] === st.syncEvery)?.[1].toLowerCase()}` : "Not connected"}</span>
                    {st?.connected
                      ? <Button size="sm" onClick={() => setManaging(i)}>{editable ? "Manage" : "Details"}</Button>
                      : <Button size="sm" variant="primary" disabled={!editable} title={editable ? undefined : "Your role can't connect integrations"} onClick={() => { setValue(""); setTouched(false); setConnecting(i); }}>Connect</Button>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!connecting} onClose={() => !busy && setConnecting(null)} title={`Connect ${connecting?.name ?? ""}`} description="Simulated: nothing you enter is sent anywhere or stored." size="sm"
        footer={<><Button variant="ghost" disabled={busy} onClick={() => setConnecting(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={connect}>{busy ? "Connecting" : "Connect"}</Button></>}>
        {connecting && (
          <Field label={connecting.field.label}>
            {(id) => (<>
              <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => setTouched(true)} placeholder={connecting.field.placeholder} autoFocus autoComplete="off" aria-invalid={touched && !!fieldErr} aria-describedby={`${id}-e`} onKeyDown={(e) => e.key === "Enter" && connect()} />
              {touched && fieldErr && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{fieldErr}</p>}
            </>)}
          </Field>
        )}
      </Modal>

      <Modal open={!!managing} onClose={() => setManaging(null)} title={`${managing?.name ?? ""} settings`} description={mState?.connectedAt ? `Connected ${fmt(mState.connectedAt)}` : undefined} size="sm"
        footer={<>{editable && managing && <Button variant="danger" className="mr-auto" onClick={() => disconnect(managing)}>Disconnect</Button>}<Button variant="primary" onClick={() => setManaging(null)}>Done</Button></>}>
        {managing && mState && (
          <div className="space-y-5">
            <Field label="Sync frequency">{(id) => <Select id={id} disabled={!editable} value={mState.syncEvery} onChange={(e) => { configureIntegration(managing.id, { syncEvery: e.target.value as typeof mState.syncEvery }); toast.info("Sync frequency updated"); }}>{SYNC.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-ink">Notify me about failures</p><p className="text-[13px] text-mute">Raise a notification if a sync fails.</p></div>
              <Switch checked={mState.notify} disabled={!editable} onChange={(v) => configureIntegration(managing.id, { notify: v })} label="Notify me about sync failures" /></div>
            <p className="text-xs text-faint">Demo connection. No data is synced from {managing.name}.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
