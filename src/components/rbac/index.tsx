"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Info, ShieldAlert, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { membersStore, permissionsStore, prefsStore, sessionStore, setPrefs } from "@/lib/state/app";
import { authorize, DEMO_AUTH_NOTICE, routePermission, type Permission, type Role } from "@/lib/rbac";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export function useSession() {
  const session = useStore(sessionStore);
  const members = useStore(membersStore);
  const user = members.find((m) => m.id === session.userId) ?? members[0];
  const role: Role = session.viewAs ?? user.role;
  return { user, actualRole: user.role, role, viewingAs: session.viewAs !== null && session.viewAs !== user.role };
}

export function useCan() {
  const { role } = useSession();
  const map = useStore(permissionsStore);
  return (p: Permission) => authorize(role, p, map);
}

/** Hides children when the demo role lacks the permission. */
export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const can = useCan();
  return <>{can(permission) ? children : fallback}</>;
}

/** Wraps a control so it is disabled with an explanation when the permission is missing. */
export function Gate({ permission, children, label }: { permission: Permission; children: React.ReactElement<Record<string, unknown>>; label?: string }) {
  const can = useCan();
  const { role } = useSession();
  if (can(permission)) return children;
  const reason = label ?? `The ${role} role can't do this.`;
  return (
    <Tooltip content={reason} side="bottom">
      <span tabIndex={0} className="inline-flex" aria-label={reason}>
        <span className="pointer-events-none inline-flex opacity-50" aria-hidden>{children}</span>
      </span>
    </Tooltip>
  );
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const can = useCan();
  const { role } = useSession();
  const needed = routePermission(pathname);
  if (needed && !can(needed)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Your role can't open this page"
        description={`The ${role} role doesn't include “${needed.replace(":", " · ")}”. Ask an Admin or Owner if you need access. (Demo permissions: switch roles from the account menu.)`}
        action={<Link href="/overview" className={buttonStyles({ variant: "primary" })}>Back to Overview</Link>}
        className="py-24"
      />
    );
  }
  return <>{children}</>;
}

export function DemoBanner() {
  const prefs = useStore(prefsStore);
  const { viewingAs, role, actualRole } = useSession();
  if (prefs.demoBannerDismissed && !viewingAs) return null;
  return (
    <div role="note" className="mb-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-[13px] leading-5 text-gold-ink">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1">
        <strong className="font-semibold">Demo mode.</strong> {DEMO_AUTH_NOTICE} All numbers on screen are simulated.
        {viewingAs && <> You&apos;re previewing as <strong>{role}</strong> (your account is {actualRole}).</>}
      </p>
      {!viewingAs && (
        <button type="button" onClick={() => setPrefs({ demoBannerDismissed: true })} aria-label="Dismiss demo notice" className="rounded-md p-0.5 hover:bg-gold/15">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
