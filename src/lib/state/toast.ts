"use client";

import { createStore } from "../store";

export type ToastTone = "success" | "error" | "info" | "warning";
export type ToastItem = { id: number; tone: ToastTone; title: string; description?: string };

export const toastStore = createStore<ToastItem[]>("toasts", [], false);
let seq = 0;

function push(tone: ToastTone, title: string, description?: string, ms = 4500) {
  const id = ++seq;
  toastStore.set((p) => [...p.slice(-3), { id, tone, title, description }]);
  setTimeout(() => dismissToast(id), ms);
  return id;
}
export const dismissToast = (id: number) => toastStore.set((p) => p.filter((t) => t.id !== id));

export const toast = {
  success: (t: string, d?: string) => push("success", t, d),
  error: (t: string, d?: string) => push("error", t, d, 7000),
  info: (t: string, d?: string) => push("info", t, d),
  warning: (t: string, d?: string) => push("warning", t, d, 6000),
};
