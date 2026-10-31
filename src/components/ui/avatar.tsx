import { cn } from "@/lib/cn";
import { initials, memberById } from "@/lib/data/people";

const sizes = { sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" };

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-raised font-display font-medium text-ink", sizes[size], className)}
      title={name}
      aria-label={name}
      role="img"
    >
      {initials(name)}
    </span>
  );
}

export function AvatarGroup({ ids, max = 3, size = "sm" }: { ids: string[]; max?: number; size?: keyof typeof sizes }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((id) => (
        <Avatar key={id} name={memberById(id).name} size={size} className="ring-2 ring-surface" />
      ))}
      {extra > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full border border-line-strong bg-sunken text-[10px] font-medium text-mute ring-2 ring-surface", sizes[size])}>
          +{extra}
        </span>
      )}
    </div>
  );
}
