"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { dismissToast, toastStore, type ToastTone } from "@/lib/state/toast";
import { cn } from "@/lib/cn";

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const colors: Record<ToastTone, string> = { success: "text-pos", error: "text-neg", info: "text-info", warning: "text-warn" };

export function Toaster() {
  const toasts = useStore(toastStore);
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className="animate-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-raised p-3.5 shadow-pop">
            <Icon className={cn("mt-0.5 size-[18px] shrink-0", colors[t.tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-5 text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs leading-5 text-mute">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="rounded-md p-0.5 text-faint hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
