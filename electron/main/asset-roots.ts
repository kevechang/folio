import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let loaded = false;
const documentRoots = new Set<string>();
const folderRoots = new Set<string>();
function filePath() {
  return typeof app.getPath === "function"
    ? join(app.getPath("userData"), "authorized-asset-roots.json")
    : null;
}
function load() {
  if (loaded) return;
  loaded = true;
  const path = filePath();
  if (!path || !existsSync(path)) return;
  try {
    const saved = JSON.parse(readFileSync(path, "utf8")) as {
      documents?: string[];
      folders?: string[];
    };
    saved.documents?.forEach((root) => documentRoots.add(resolve(root)));
    saved.folders?.forEach((root) => folderRoots.add(resolve(root)));
  } catch {
    /* A damaged authorization file grants no access. */
  }
}
function persist() {
  const path = filePath();
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ documents: [...documentRoots], folders: [...folderRoots] }));
}
export function allowDocumentAssets(path: string) {
  load();
  documentRoots.add(resolve(dirname(path)));
  persist();
}
export function allowFolderAssets(path: string) {
  load();
  folderRoots.add(resolve(path));
  persist();
}
export function removeFolderAssets(path: string) {
  load();
  folderRoots.delete(resolve(path));
  persist();
}
export function authorizedAssetRoots() {
  load();
  return new Set([...documentRoots, ...folderRoots]);
}
