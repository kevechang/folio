import { get, set, del, keys } from "idb-keyval";

export type Recent = {
  id: string;
  path: string;
  name: string;
  kind: "excalidraw" | "png" | "svg" | "markdown";
  lastOpenedAt: number;
  mtime: number;
  elementCount: number;
  bg: string;
  title?: string;
  excerpt?: string;
  words?: number;
};

export type Draft = {
  id: string;
  name: string;
  json: string;
  updatedAt: number;
  elementCount?: number;
  bg?: string;
  kind?: "canvas" | "markdown";
  text?: string;
};

export async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    return (await get<T>(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function safeSet<T>(key: string, value: T) {
  try {
    await set(key, value);
  } catch {}
}

export async function safeDelete(key: string) {
  try {
    await del(key);
  } catch {}
}

export function upsertRecent(items: Recent[], item: Recent): Recent[] {
  return [item, ...items.filter((v) => v.path !== item.path)].slice(0, 50);
}

export function removeRecent(items: Recent[], id: string): Recent[] {
  return items.filter((v) => v.id !== id);
}

export async function listDrafts(): Promise<Draft[]> {
  try {
    const all = await keys();
    const draftKeys = all.filter(
      (key): key is string => typeof key === "string" && key.startsWith("draft:"),
    );
    const drafts = await Promise.all(draftKeys.map((key) => get<Draft>(key)));
    return drafts.filter((draft): draft is Draft => draft !== undefined);
  } catch {
    return [];
  }
}

export function hashPath(path: string): string {
  let hash = 2166136261;
  for (const char of path) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
