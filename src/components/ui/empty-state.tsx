import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon, title, description, action, className,
}: { icon: LucideIcon; title: string; description: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-raised text-gold">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-5 text-mute">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
