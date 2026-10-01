import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, parseSetting, type Settings } from "./settings";

const listeners = new Map<keyof Settings, Set<() => void>>();
const memory = new Map<keyof Settings, string>();
const storageUnavailable = new Set<keyof Settings>();

function read<K extends keyof Settings>(key: K): Settings[K] {
  if (storageUnavailable.has(key)) return parseSetting(key, memory.get(key) ?? null);
  try {
    return parseSetting(key, localStorage.getItem(`folio-${key}`));
  } catch {
    return parseSetting(key, memory.get(key) ?? null);
  }
}

function notify(key: keyof Settings) {
  listeners.get(key)?.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    const key = event.key?.replace(/^folio-/, "") as keyof Settings | undefined;
    if (key && key in DEFAULT_SETTINGS) notify(key);
  });
}

export function useSetting<K extends keyof Settings>(key: K) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const group = listeners.get(key) ?? new Set<() => void>();
      group.add(listener);
      listeners.set(key, group);
      return () => {
        group.delete(listener);
        if (!group.size) listeners.delete(key);
      };
    },
    [key],
  );
  const snapshot = useCallback(() => read(key), [key]);
  const value = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_SETTINGS[key]);
  const update = useCallback(
    (next: Settings[K]) => {
      const stored = String(next);
      memory.set(key, stored);
      try {
        localStorage.setItem(`folio-${key}`, stored);
        storageUnavailable.delete(key);
      } catch {
        storageUnavailable.add(key);
        // Keep the setting active in memory when storage is unavailable.
      }
      notify(key);
    },
    [key],
  );
  return [value, update] as const;
}
