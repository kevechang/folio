import { platform } from "../../../lib/platform";

export const imageLimit = 20 * 1024 * 1024;
export const largeImageLimit = 2 * 1024 * 1024;

export function imageMime(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  return (
    (
      {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        avif: "image/avif",
        svg: "image/svg+xml",
      } as Record<string, string>
    )[ext ?? ""] ?? "application/octet-stream"
  );
}

export function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

export function localImagePath(src: string): string | null {
  if (!src.startsWith("folio-asset://local")) return null;
  return decodeURIComponent(new URL(src).pathname);
}

export function relativeImagePath(path: string, documentPath: string | null): string {
  if (!documentPath) return path;
  const base = documentPath.slice(0, documentPath.lastIndexOf("/") + 1);
  if (path.startsWith(base)) return path.slice(base.length);
  const from = base.split("/").filter(Boolean);
  const to = path.split("/").filter(Boolean);
  while (from.length && to.length && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return `${"../".repeat(from.length)}${to.join("/")}`;
}

export async function inlineLocalImages(
  root: HTMLElement,
  exportTargetPath: string | null,
  options: { format?: "html" | "pdf"; limit?: number } = {},
) {
  const limit = options.format === "pdf" ? Number.POSITIVE_INFINITY : (options.limit ?? imageLimit);
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  let rejectedImages = 0;
  const local = await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute("src") ?? "";
      if (!src.startsWith("folio-asset://local")) return null;
      try {
        const path = localImagePath(src);
        const bytes = path ? await platform.readAsset(path) : null;
        if (path && bytes) return { image, path, bytes };
      } catch {
        // A denied or unreadable image must not abort the rest of the export.
      }
      image.removeAttribute("src");
      rejectedImages++;
      return null;
    }),
  );
  const records = local.filter((item): item is NonNullable<typeof item> => item !== null);
  const imagesKept = records.reduce((sum, item) => sum + item.bytes.byteLength, 0) > limit;
  const hasLargeImages = records.some((item) => item.bytes.byteLength > largeImageLimit);
  for (const { image, path, bytes } of records)
    image.setAttribute(
      "src",
      imagesKept
        ? relativeImagePath(path, exportTargetPath)
        : `data:${imageMime(path)};base64,${base64(bytes)}`,
    );
  return { imagesKept, hasLargeImages, rejectedImages };
}
