import electronPlatform from "./electron";
import webPlatform from "./web";
import type { Platform } from "./types";

export { ConflictError } from "./errors";
export type { DragDropEvent, FileEntry, FileStat, Platform } from "./types";

export const platform: Platform = "folio" in window ? electronPlatform : webPlatform;
