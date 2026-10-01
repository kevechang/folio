import type { LatestScene } from "../features/document/types";
import { generateNKeysBetween } from "fractional-indexing";

type SceneElement = LatestScene["elements"][number];
type TextElement = Extract<SceneElement, { type: "text" }>;
type ContainerElement = Extract<SceneElement, { type: "rectangle" | "ellipse" | "diamond" }>;
type VerticalAlign = TextElement["verticalAlign"];

const padding = 5;
const alignments: VerticalAlign[] = ["top", "middle", "bottom"];

// Excalidraw 0.18.1 dist/dev: getContainerCoords, getBoundTextMaxWidth/Height,
// and computeBoundTextPosition. These helpers are not exported by the package.
function boundTextPosition(container: ContainerElement, text: TextElement, align: VerticalAlign) {
  let offsetX = padding;
  let offsetY = padding;
  let maxWidth = container.width - padding * 2;
  let maxHeight = container.height - padding * 2;
  if (container.type === "ellipse") {
    offsetX += (container.width / 2) * (1 - Math.sqrt(2) / 2);
    offsetY += (container.height / 2) * (1 - Math.sqrt(2) / 2);
    maxWidth = Math.round((container.width / 2) * Math.sqrt(2)) - padding * 2;
    maxHeight = Math.round((container.height / 2) * Math.sqrt(2)) - padding * 2;
  } else if (container.type === "diamond") {
    offsetX += container.width / 4;
    offsetY += container.height / 4;
    maxWidth = Math.round(container.width / 2) - padding * 2;
    maxHeight = Math.round(container.height / 2) - padding * 2;
  }
  const x =
    container.x +
    offsetX +
    (text.textAlign === "left"
      ? 0
      : text.textAlign === "right"
        ? maxWidth - text.width
        : maxWidth / 2 - text.width / 2);
  const y =
    container.y +
    offsetY +
    (align === "top"
      ? 0
      : align === "bottom"
        ? maxHeight - text.height
        : maxHeight / 2 - text.height / 2);
  return { x, y };
}

function newGroupId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function inferBoundTextAlign(elements: LatestScene["elements"]): LatestScene["elements"] {
  const containers = new Map(elements.map((element) => [element.id, element]));
  const positions = new Map(elements.map((element, index) => [element.id, index]));
  const changed = new Map<string, SceneElement>();
  const detachedGroups = new Map<string, string>();
  const movedByContainer = new Map<string, string[]>();
  const movedIds = new Set<string>();
  for (const element of elements) {
    if (element.type !== "text" || !element.containerId || element.isDeleted) continue;
    const container = containers.get(element.containerId);
    if (
      !container ||
      container.isDeleted ||
      (container.type !== "rectangle" &&
        container.type !== "ellipse" &&
        container.type !== "diamond")
    )
      continue;

    const matching = alignments.filter((align) => {
      const position = boundTextPosition(container, element, align);
      return Math.abs(position.x - element.x) <= 1 && Math.abs(position.y - element.y) <= 1;
    });
    if (matching.length) {
      const align = matching.includes(element.verticalAlign) ? element.verticalAlign : matching[0];
      if (element.verticalAlign !== align)
        changed.set(element.id, { ...element, verticalAlign: align });
      continue;
    }

    if (
      container.groupIds.length !== element.groupIds.length ||
      container.groupIds.some((id, index) => id !== element.groupIds[index])
    )
      continue;

    const existingGroup = detachedGroups.get(container.id);
    const groupId = existingGroup ?? newGroupId();
    detachedGroups.set(container.id, groupId);
    const currentContainer = (changed.get(container.id) ?? container) as ContainerElement;
    changed.set(container.id, {
      ...currentContainer,
      boundElements:
        currentContainer.boundElements?.filter((bound) => bound.id !== element.id) ?? null,
      groupIds: existingGroup ? currentContainer.groupIds : [groupId, ...currentContainer.groupIds],
    });
    changed.set(element.id, {
      ...element,
      containerId: null,
      autoResize: false,
      groupIds: [groupId, ...element.groupIds],
    });
    if (positions.get(element.id)! < positions.get(container.id)!) {
      const moved = movedByContainer.get(container.id) ?? [];
      moved.push(element.id);
      movedByContainer.set(container.id, moved);
      movedIds.add(element.id);
    }
  }
  if (!movedIds.size) return elements.map((element) => changed.get(element.id) ?? element);

  const reordered: SceneElement[] = [];
  for (const element of elements) {
    if (movedIds.has(element.id)) continue;
    reordered.push(changed.get(element.id) ?? element);
    for (const id of movedByContainer.get(element.id) ?? []) reordered.push(changed.get(id)!);
  }

  // Keep untouched indices when possible. Only the inserted text needs a key
  // between its new neighbours; rebuild all keys if the input was already invalid.
  try {
    for (let start = 0; start < reordered.length;) {
      if (!movedIds.has(reordered[start].id)) {
        start++;
        continue;
      }
      let end = start + 1;
      while (end < reordered.length && movedIds.has(reordered[end].id)) end++;
      const indices = generateNKeysBetween(
        reordered[start - 1]?.index,
        reordered[end]?.index,
        end - start,
      );
      for (let i = start; i < end; i++)
        reordered[i] = { ...reordered[i], index: indices[i - start] as SceneElement["index"] };
      start = end;
    }
    if (
      reordered.some(
        (element, index) =>
          !element.index || (index > 0 && reordered[index - 1].index >= element.index),
      )
    ) {
      throw new Error("Invalid fractional index order");
    }
  } catch {
    const indices = generateNKeysBetween(null, null, reordered.length);
    return reordered.map((element, index) => ({
      ...element,
      index: indices[index] as SceneElement["index"],
    }));
  }
  return reordered;
}
