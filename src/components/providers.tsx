"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { ShellProvider } from "@/components/layout/shell-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { ConfirmProvider } from "@/components/ui/confirm";
import { Toaster } from "@/components/ui/toast";
import { hydrateAll } from "@/lib/store";
import { useEffect } from "react";

function Hydrator() {
  useEffect(() => {
    hydrateAll();
    const onStorage = () => hydrateAll();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <ShellProvider>
          <NotificationsProvider>
            <Hydrator />
            <ConfirmProvider>{children}</ConfirmProvider>
            <Toaster />
          </NotificationsProvider>
        </ShellProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
