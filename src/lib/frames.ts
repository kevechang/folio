import type {
  ExcalidrawElement,
  ExcalidrawFrameLikeElement,
} from "@excalidraw/excalidraw/element/types";

export function orderFrames(elements: readonly ExcalidrawElement[]): ExcalidrawFrameLikeElement[] {
  const frames = elements
    .filter(
      (element): element is ExcalidrawFrameLikeElement =>
        !element.isDeleted && (element.type === "frame" || element.type === "magicframe"),
    )
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: ExcalidrawFrameLikeElement[][] = [];
  for (const frame of frames) {
    const row = rows.find((group) =>
      group.some(
        (member) => Math.abs(frame.y - member.y) < Math.min(frame.height, member.height) / 2,
      ),
    );
    if (row) row.push(frame);
    else rows.push([frame]);
  }
  return rows
    .sort((a, b) => Math.min(...a.map((frame) => frame.y)) - Math.min(...b.map((frame) => frame.y)))
    .flatMap((row) => row.sort((a, b) => a.x - b.x || a.y - b.y));
}

export function clampFramePage(page: number, count: number): number {
  return Math.max(0, Math.min(page, Math.max(0, count - 1)));
}
