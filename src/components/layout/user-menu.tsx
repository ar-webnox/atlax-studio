"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, ChevronDown, CreditCard, Keyboard, LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import { ROLES } from "@/lib/rbac";
import { sessionStore } from "@/lib/state/app";
import { setIntent } from "@/lib/state/intent";
import { toast } from "@/lib/state/toast";
import { Avatar } from "@/components/ui/avatar";
import { MenuItem } from "@/components/ui/dropdown";
import { Popover } from "@/components/ui/popover";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/rbac";
import { useShell } from "./shell-context";

export function UserMenu() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { setShortcutsOpen } = useShell();
  const { user, role, actualRole, viewingAs } = useSession();
  const [confirmOut, setConfirmOut] = useState(false);
  const toSettings = (tab: string) => () => { setIntent(`settings:${tab}`); router.push("/settings"); };

  return (
    <>
      <Popover label="Account" role="menu" panelClassName="w-72 p-1.5 max-h-[calc(100dvh-5rem)] overflow-y-auto"
        trigger={(p) => (
          <button type="button" {...p} aria-label="Open account menu" className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-raised">
            <Avatar name={user.name} />
            <ChevronDown className="size-4 text-faint max-sm:hidden" aria-hidden />
          </button>
        )}>
        {(close) => (
          <>
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-mute">{user.email}</p>
              </div>
              <Badge tone={viewingAs ? "warn" : "gold"}>{role}</Badge>
            </div>
            <div role="separator" className="my-1.5 h-px bg-line" />
            <MenuItem label="Your profile" icon={User} onSelect={toSettings("profile")} close={close} />
            <MenuItem label="Workspace settings" icon={Settings} onSelect={toSettings("workspace")} close={close} />
            <MenuItem label="Billing" icon={CreditCard} onSelect={toSettings("billing")} close={close} />
            <MenuItem label="Keyboard shortcuts" icon={Keyboard} hint="?" onSelect={() => setShortcutsOpen(true)} close={close} />
            <div role="separator" className="my-1.5 h-px bg-line" />
            <p className="px-2.5 pb-1 pt-1 text-xs font-medium text-faint">Preview as role (demo)</p>
            {ROLES.map((r) => (
              <button key={r} type="button" role="menuitemradio" aria-checked={r === role}
                onClick={() => { sessionStore.set((s) => ({ ...s, viewAs: r === actualRole ? null : r })); toast.info(r === actualRole ? "Back to your own role" : `Previewing as ${r}`, "Demo only: permissions are simulated in this browser."); close(); }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised">
                <span>{r}{r === actualRole && <span className="ml-2 text-xs text-faint">your role</span>}</span>
                {r === role && <Check className="size-4 text-gold" aria-hidden />}
              </button>
            ))}
            <div role="separator" className="my-1.5 h-px bg-line" />
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[13px] text-mute">Theme</span>
              <span className="flex gap-0.5 rounded-lg border border-line bg-sunken p-0.5" role="group" aria-label="Theme">
                {([["light", Sun], ["dark", Moon], ["system", Monitor]] as const).map(([t, Icon]) => (
                  <button key={t} type="button" aria-pressed={theme === t} aria-label={`${t[0].toUpperCase()}${t.slice(1)} theme`} onClick={() => setTheme(t)}
                    className={`rounded-md p-1.5 ${theme === t ? "bg-surface text-gold shadow-card" : "text-faint hover:text-ink"}`}>
                    <Icon className="size-3.5" />
                  </button>
                ))}
              </span>
            </div>
            <div role="separator" className="my-1.5 h-px bg-line" />
            <MenuItem label="Sign out" icon={LogOut} danger onSelect={() => setConfirmOut(true)} close={close} />
          </>
        )}
      </Popover>
      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="Sign out of ATLAX Studio?" description="You'll need to sign in again to see your workspaces." size="sm"
        footer={<><Button variant="ghost" onClick={() => setConfirmOut(false)}>Stay signed in</Button><Button variant="danger" onClick={() => { setConfirmOut(false); toast.info("Signed out (demo)", "Authentication isn't connected, so you're still in the demo."); }}>Sign out</Button></>}>
        <p className="text-sm text-mute">Authentication isn&apos;t connected in this build, so signing out only closes this dialog.</p>
      </Modal>
    </>
  );
}
