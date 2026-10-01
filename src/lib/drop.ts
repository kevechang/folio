export type DropContext = "library" | "read" | "edit" | "markdown-edit";
export type DropLabel = "open" | "insert" | "library" | "unsupported";
export type DropAction =
  | "open"
  | "inspect-image"
  | "insert-images"
  | "insert-reference"
  | "import-library"
  | "reject-image"
  | "reject-library"
  | "unsupported";
export type DropResolution = {
  label: DropLabel;
  action: DropAction;
  paths: string[];
  ignored: number;
};

function extension(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function resolveDrop({
  paths,
  context,
}: {
  paths: string[];
  context: DropContext;
}): DropResolution {
  const scenes = paths.filter((path) =>
    ["excalidraw", "json", "md", "markdown"].includes(extension(path)),
  );
  const ambiguous = paths.filter((path) => ["png", "svg"].includes(extension(path)));
  const images = paths.filter((path) => ["jpg", "jpeg", "webp", "gif"].includes(extension(path)));
  const libraries = paths.filter((path) => extension(path) === "excalidrawlib");
  const firstOpen = paths.find((path) => scenes.includes(path) || ambiguous.includes(path));
  const markdown = paths.find((path) => /\.(md|markdown)$/i.test(path));
  if (context === "markdown-edit" && markdown)
    return { label: "open", action: "open", paths: [markdown], ignored: paths.length - 1 };
  const canvasReference = paths.find((path) => /\.excalidraw$/i.test(path));
  if (context === "markdown-edit" && canvasReference) {
    return {
      label: "insert",
      action: "insert-reference",
      paths: [canvasReference],
      ignored: paths.length - 1,
    };
  }
  if (context === "edit" && scenes.length === 0 && ambiguous.length + images.length > 0) {
    const selected = paths.filter((path) => ambiguous.includes(path) || images.includes(path));
    return {
      label: "insert",
      action: ambiguous.length ? "inspect-image" : "insert-images",
      paths: selected,
      ignored: paths.length - selected.length,
    };
  }
  if (firstOpen) {
    return {
      label: "open",
      action: ambiguous.includes(firstOpen) ? "inspect-image" : "open",
      paths: [firstOpen],
      ignored: paths.length - 1,
    };
  }
  if (libraries.length) {
    return {
      label: context === "edit" ? "library" : "unsupported",
      action: context === "edit" ? "import-library" : "reject-library",
      paths: [libraries[0]],
      ignored: paths.length - 1,
    };
  }
  if (images.length) {
    return {
      label: context === "edit" ? "insert" : "unsupported",
      action: context === "edit" ? "insert-images" : "reject-image",
      paths: context === "edit" ? images : [images[0]],
      ignored: context === "edit" ? paths.length - images.length : paths.length - 1,
    };
  }
  return { label: "unsupported", action: "unsupported", paths: [], ignored: paths.length };
}

export const dropCopy: Record<DropLabel, { label: string; description: string }> = {
  open: { label: "松手打开", description: "支持 Excalidraw 画布和 Markdown 文稿" },
  insert: { label: "松手插入图片", description: "把图片放入画布" },
  library: { label: "松手导入到素材库", description: "支持 .excalidrawlib" },
  unsupported: { label: "不支持这种文件", description: "请选择可打开的画布" },
};

export function resolveImageContent(
  context: DropContext,
  hasScene: boolean,
): "open" | "insert-images" | "reject-image" {
  if (hasScene) return "open";
  return context === "edit" ? "insert-images" : "reject-image";
}
