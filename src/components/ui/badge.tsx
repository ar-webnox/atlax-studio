import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "gold" | "pos" | "neg" | "warn" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-mute border-line",
  gold: "bg-gold-soft text-gold-ink border-gold/25",
  pos: "bg-pos/10 text-pos border-pos/25",
  neg: "bg-neg/10 text-neg border-neg/25",
  warn: "bg-warn/10 text-warn border-warn/25",
  info: "bg-info/10 text-info border-info/25",
};

export function Badge({ tone = "neutral", dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
