"use client";

import Link from "next/link";
import { useState } from "react";
import { BellOff, CheckCheck, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { kindIcon } from "@/components/layout/notification-panel";
import { pushNotification, useNotifications } from "@/lib/notifications-context";
import { useStore } from "@/lib/store";
import { notifPrefsStore } from "@/lib/state/app";
import { toast } from "@/lib/state/toast";
import type { NotificationKind } from "@/lib/data/notifications";
import { cn } from "@/lib/cn";

type Tab = "all" | "unread" | "mention" | "alert" | "system";

const prefs = [
  { id: "alerts", label: "Critical alerts", detail: "Outages, failed reports and security events." },
  { id: "mentions", label: "Mentions and comments", detail: "When someone tags you or replies to you." },
  { id: "reports", label: "Report deliveries", detail: "When a scheduled report is ready." },
  { id: "digest", label: "Weekly digest", detail: "A Monday summary of what changed." },
];

export function NotificationsView() {
  const { items, unread, markRead, markAllRead, dismiss } = useNotifications();
  const [tab, setTab] = useState<Tab>("all");
  const channels = useStore(notifPrefsStore);
  const setChannels = (fn: (c: typeof channels) => typeof channels) => { notifPrefsStore.set(fn); };

  const filtered = items.filter((n) => tab === "all" || (tab === "unread" ? !n.read : n.kind === (tab as NotificationKind)));

  return (
    <>
      <PageHeader title="Notifications" description="Everything that needs your attention, in one place."
        actions={<><Button onClick={() => { pushNotification({ kind: "system", title: "Test notification", body: "This is a simulated notification created from the Notifications page.", href: "/notifications" }); toast.info("Test notification sent"); }}>Send test</Button><Button onClick={() => { markAllRead(); toast.success("All notifications marked as read"); }} disabled={unread === 0}><CheckCheck className="size-4" /> Mark all as read</Button></>} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <Tabs<Tab> label="Notification filters" value={tab} onChange={setTab} className="px-3"
            options={[{ value: "all", label: "All", count: items.length }, { value: "unread", label: "Unread", count: unread }, { value: "mention", label: "Mentions" }, { value: "alert", label: "Alerts" }, { value: "system", label: "System" }]} />
          {filtered.length === 0 ? (
            <EmptyState icon={BellOff} title="Nothing here right now" description="When something needs your attention, it will appear in this list." />
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((n) => {
                const Icon = kindIcon[n.kind];
                return (
                  <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border border-line", n.kind === "alert" ? "bg-neg/10 text-neg" : "bg-raised text-mute")}><Icon className="size-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("text-sm leading-5", n.read ? "text-mute" : "font-medium text-ink")}>{n.title}</p>
                        <span className="shrink-0 text-xs text-faint">{n.time}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-5 text-mute">{n.body}</p>
                      <div className="mt-2 flex items-center gap-3 text-[13px]">
                        <Link href={n.href} onClick={() => markRead(n.id)} className="font-medium text-gold-ink hover:underline">Open</Link>
                        {!n.read && <button type="button" onClick={() => markRead(n.id)} className="text-mute hover:text-ink">Mark as read</button>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`Dismiss ${n.title}`} onClick={() => { dismiss(n.id); toast.info("Notification dismissed"); }}><X className="size-4" /></Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="Delivery preferences" description="Choose how you hear about each type of update. Saved in this browser; no email or push is actually sent in the demo." />
          <div className="p-5">
            <div className="mb-2 grid grid-cols-[1fr_52px_52px] items-center gap-2 text-xs text-mute"><span /><span className="text-center">Email</span><span className="text-center">Push</span></div>
            <ul className="divide-y divide-line">
              {prefs.map((p) => (
                <li key={p.id} className="grid grid-cols-[1fr_52px_52px] items-center gap-2 py-3.5">
                  <div className="min-w-0"><p className="text-[13px] font-medium text-ink">{p.label}</p><p className="text-xs leading-5 text-mute">{p.detail}</p></div>
                  <div className="flex justify-center"><Switch label={`${p.label} by email`} checked={channels[p.id].email} onChange={(v) => setChannels((c) => ({ ...c, [p.id]: { ...c[p.id], email: v } }))} /></div>
                  <div className="flex justify-center"><Switch label={`${p.label} by push`} checked={channels[p.id].push} onChange={(v) => setChannels((c) => ({ ...c, [p.id]: { ...c[p.id], push: v } }))} /></div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
