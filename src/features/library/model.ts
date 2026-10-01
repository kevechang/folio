import type { Recent, Draft } from "../../lib/persistence";
import type { LibraryItem } from "./types";
import type { FileStat } from "../../lib/platform";

export function mergeMissing(
  items: Recent[],
  stats: (FileStat | null)[],
): (Recent & { missing: boolean })[] {
  return items.map((item, index) => ({ ...item, missing: stats[index] === null }));
}

export function sortDrafts(items: Draft[]): Draft[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const needle = query.trim().toLocaleLowerCase();
  return needle ? items.filter((item) => item.name.toLocaleLowerCase().includes(needle)) : items;
}

export function filterByKind(items: LibraryItem[], kind: "all" | "canvas" | "markdown") {
  if (kind === "all") return items;
  return items.filter((item) => (item.kind === "markdown") === (kind === "markdown"));
}

export function gridNextIndex(index: number, columns: number, length: number, key: string): number {
  const step =
    key === "ArrowLeft"
      ? -1
      : key === "ArrowRight"
        ? 1
        : key === "ArrowUp"
          ? -columns
          : key === "ArrowDown"
            ? columns
            : 0;
  return Math.max(0, Math.min(length - 1, index + step));
}
