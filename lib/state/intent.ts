"use client";

import { createStore, useStore } from "../store";
import { useEffect } from "react";

/** One-shot UI intents (e.g. "open the new report dialog") so the command menu and shortcuts can trigger page actions. */
export const intentStore = createStore<string | null>("intent", null, false);
export const setIntent = (i: string | null) => intentStore.set(i);

export function useIntent(name: string, handler: () => void) {
  const intent = useStore(intentStore);
  useEffect(() => {
    if (intent === name) {
      handler();
      intentStore.set(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, name]);
}
