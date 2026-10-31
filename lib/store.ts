"use client";

import { useSyncExternalStore } from "react";

export type Store<T> = {
  key: string;
  initial: T;
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (l: () => void) => () => void;
  hydrate: () => void;
};

const registry: Store<unknown>[] = [];
const PREFIX = "atlax:v2:";

/**
 * Tiny external store with optional localStorage persistence.
 * Server and first client render use `initial`; `hydrateAll()` then loads saved state,
 * so there is never a hydration mismatch.
 */
export function createStore<T>(key: string, initial: T, persist = true): Store<T> {
  let state = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const store: Store<T> = {
    key,
    initial,
    get: () => state,
    set: (next) => {
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      if (persist && hydrated) {
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(state));
        } catch {
          /* storage full or unavailable */
        }
      }
      emit();
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    hydrate: () => {
      if (persist) {
        try {
          const raw = localStorage.getItem(PREFIX + key);
          if (raw) {
            const parsed = JSON.parse(raw);
            state = Array.isArray(initial) || typeof initial !== "object" || initial === null ? parsed : { ...initial, ...parsed };
          }
        } catch {
          /* ignore corrupt data */
        }
      }
      hydrated = true;
      emit();
    },
  };
  registry.push(store as Store<unknown>);
  return store;
}

export function hydrateAll() {
  registry.forEach((s) => s.hydrate());
}

export function resetAllStores() {
  registry.forEach((s) => {
    try {
      localStorage.removeItem(PREFIX + s.key);
    } catch {
      /* ignore */
    }
  });
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}

export const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
