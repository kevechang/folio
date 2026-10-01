import type { LatestScene } from "../features/document/types";
import { scheduleIdle } from "./idle";
import { safeGet, safeSet } from "./persistence";
import { platform } from "./platform";

export type ThumbnailRecord = { blob: Blob; mtime: number; elementCount?: number; bg?: string };

type ThumbnailScene = Pick<LatestScene, "elements" | "files"> & {
  appState: Partial<LatestScene["appState"]>;
};

const queue: (() => Promise<void>)[] = [];
let busy = false;

function drain() {
  if (busy || queue.length === 0) return;
  busy = true;
  scheduleIdle(() => {
    const job = queue.shift();
    void job?.().finally(() => {
      busy = false;
      drain();
    });
  });
}

export function enqueueThumbnail(job: () => Promise<void>) {
  queue.push(job);
  drain();
}

export async function readThumbnailRecord(
  id: string,
  mtime?: number,
): Promise<ThumbnailRecord | null> {
  const record = await safeGet<ThumbnailRecord | null>(`thumb:${id}`, null);
  return record && (mtime === undefined || record.mtime === mtime) ? record : null;
}

export async function readThumbnail(id: string, mtime?: number): Promise<Blob | null> {
  return (await readThumbnailRecord(id, mtime))?.blob ?? null;
}

async function renderThumbnail(scene: ThumbnailScene): Promise<Omit<ThumbnailRecord, "mtime">> {
  const { exportToBlob } = await import("@excalidraw/excalidraw");
  const elements = scene.elements.filter((element) => !element.isDeleted);
  const blob = await exportToBlob({
    elements,
    files: scene.files,
    appState: {
      ...scene.appState,
      exportBackground: true,
      exportScale: 1,
      exportWithDarkMode: false,
    },
    maxWidthOrHeight: 640,
    exportPadding: 48,
    mimeType: "image/png",
  });
  return { blob, elementCount: elements.length, bg: scene.appState.viewBackgroundColor };
}

async function writeThumbnail(id: string, mtime: number, scene: ThumbnailScene): Promise<void> {
  const rendered = await renderThumbnail(scene);
  await safeSet(`thumb:${id}`, { ...rendered, mtime } satisfies ThumbnailRecord);
  window.dispatchEvent(new CustomEvent("folio-thumbnail", { detail: id }));
}

export function generateThumbnail(path: string, id: string, mtime: number): void {
  enqueueThumbnail(async () => {
    if (await readThumbnail(id, mtime)) return;
    try {
      const bytes = await platform.readFile(path);
      const ext = path.toLowerCase().split(".").pop();
      const type =
        ext === "png"
          ? "image/png"
          : ext === "svg"
            ? "image/svg+xml"
            : "application/vnd.excalidraw+json";
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      const scene = await loadFromBlob(new Blob([new Uint8Array(bytes)], { type }), null, null);
      await writeThumbnail(id, mtime, scene);
    } catch {
      // A thumbnail failure leaves the source document usable.
    }
  });
}

export function storeSceneThumbnail(id: string, scene: LatestScene, mtime: number): void {
  enqueueThumbnail(async () => {
    try {
      await writeThumbnail(id, mtime, scene);
    } catch {
      // Draft data remains available even when its preview fails.
    }
  });
}
