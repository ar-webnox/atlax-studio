"use client";

import { cn } from "@/lib/cn";
import { DemoBanner, RouteGuard } from "@/components/rbac";
import { CommandMenu } from "./command-menu";
import { Navbar } from "./navbar";
import { MobileNav, Sidebar } from "./sidebar";
import { ShortcutsModal, useShortcuts } from "./shortcuts";
import { useShell } from "./shell-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useShell();
  useShortcuts();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-[80] rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Sidebar />
      <MobileNav />
      <div className={cn("flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
        <Navbar />
        <main id="main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1480px] flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          <DemoBanner />
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
      <CommandMenu />
      <ShortcutsModal />
    </div>
  );
}
