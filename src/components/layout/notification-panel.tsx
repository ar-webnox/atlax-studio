"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, AtSign, Bell, CheckCheck, FileText, Server, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNotifications } from "@/lib/notifications-context";
import type { NotificationKind } from "@/lib/data/notifications";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";

export const kindIcon: Record<NotificationKind, LucideIcon> = {
  alert: AlertTriangle, mention: AtSign, report: FileText, system: Server, team: Users,
};

export function NotificationPanel() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const shown = (tab === "all" ? items : items.filter((n) => !n.read)).slice(0, 6);

  return (
    <Popover
      label="Notifications"
      sheetOnMobile
      panelClassName="w-[380px] max-sm:w-auto"
      trigger={(p) => (
        <Button variant="ghost" size="icon" {...p} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold tabular text-on-gold ring-2 ring-canvas">
              {unread}
            </span>
          )}
        </Button>
      )}
    >
      {(close) => (
        <div className="flex max-h-[min(34rem,calc(100dvh-6rem))] flex-col">
          <div className="flex items-center justify-between px-4 pt-3.5">
            <h2 className="font-display text-[15px] font-semibold">Notifications</h2>
            <Button size="sm" variant="ghost" onClick={markAllRead} disabled={unread === 0}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          </div>
          <Tabs
            label="Filter notifications"
            value={tab}
            onChange={setTab}
            className="px-2"
            options={[{ value: "all", label: "All" }, { value: "unread", label: "Unread", count: unread }]}
          />
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <EmptyState icon={CheckCheck} title="You're all caught up" description="New alerts and mentions will show up here." className="py-10" />
            ) : (
              <ul className="divide-y divide-line">
                {shown.map((n) => {
                  const Icon = kindIcon[n.kind];
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => {
                          markRead(n.id);
                          close();
                        }}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-raised"
                      >
                        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line", n.kind === "alert" ? "bg-neg/10 text-neg" : "bg-raised text-mute")}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={cn("text-[13px] leading-5", n.read ? "text-mute" : "font-medium text-ink")}>{n.title}</span>
                            {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                          </span>
                          <span className="line-clamp-2 text-xs leading-5 text-mute">{n.body}</span>
                          <span className="mt-0.5 block text-xs text-faint">{n.time}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-line p-2">
            <Link href="/notifications" onClick={close} className="flex h-9 items-center justify-center rounded-lg text-[13px] font-medium text-ink hover:bg-raised">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </Popover>
  );
}
