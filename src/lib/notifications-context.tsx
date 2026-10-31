"use client";

import { createStore, uid, useStore } from "./store";
import { initialNotifications, type Notification, type NotificationKind } from "./data/notifications";

/** Notifications now live in a persisted store so any action in the app can raise one. */
export const notificationsStore = createStore<Notification[]>("notifications", initialNotifications);

export function pushNotification(n: { kind: NotificationKind; title: string; body: string; href: string }) {
  notificationsStore.set((p) => [{ id: uid("n"), read: false, time: "Just now", ...n }, ...p].slice(0, 40));
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useNotifications() {
  const items = useStore(notificationsStore);
  return {
    items,
    unread: items.filter((n) => !n.read).length,
    markRead: (id: string) => notificationsStore.set((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n))),
    markAllRead: () => notificationsStore.set((p) => p.map((n) => ({ ...n, read: true }))),
    dismiss: (id: string) => notificationsStore.set((p) => p.filter((n) => n.id !== id)),
  };
}
