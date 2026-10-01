import { realpath } from "node:fs/promises";
import { extname, isAbsolute, resolve, sep } from "node:path";

export function isAllowedAsset(path: string, roots: Iterable<string>) {
  const target = resolve(path);
  const extension = extname(target).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"].includes(extension))
    return false;
  return Array.from(roots).some((root) => target.startsWith(resolve(root) + sep));
}

export async function resolveAuthorizedAssetPath(
  path: string,
  roots: Iterable<string>,
): Promise<string | null> {
  try {
    const assetRoots = Array.from(roots);
    if (!isAbsolute(path) || !isAllowedAsset(path, assetRoots)) return null;
    const real = await realpath(path);
    const realRoots = await Promise.all(assetRoots.map((root) => realpath(root).catch(() => root)));
    return isAllowedAsset(real, realRoots) ? real : null;
  } catch {
    return null;
  }
}
