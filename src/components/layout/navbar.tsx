"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Breadcrumbs } from "./breadcrumbs";
import { GlobalSearch } from "./global-search";
import { NotificationPanel } from "./notification-panel";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useShell } from "./shell-context";

export function Navbar() {
  const { collapsed, toggleCollapsed, setMobileOpen, setCommandOpen } = useShell();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
        <Menu className="size-5" />
      </Button>
      <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="bottom">
        <Button variant="ghost" size="icon" className="max-lg:hidden" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapsed}>
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
        </Button>
      </Tooltip>
      <div className="min-w-0 flex-1 md:flex-none md:basis-64 lg:basis-auto"><Breadcrumbs /></div>
      <div className="hidden flex-1 justify-center md:flex"><GlobalSearch /></div>
      <div className="flex items-center gap-1">
        <Tooltip content="All numbers in this build are simulated. Nothing is connected to a real data source." side="bottom">
          <span tabIndex={0} className="mr-1 hidden xl:inline-flex"><Badge tone="gold">Demo data</Badge></span>
        </Tooltip>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setCommandOpen(true)}>
          <Search className="size-[18px]" />
        </Button>
        <ThemeToggle />
        <NotificationPanel />
        <UserMenu />
      </div>
    </header>
  );
}
