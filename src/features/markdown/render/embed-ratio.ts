export const DEFAULT_EMBED_RATIO = 16 / 9;
export const EMBED_EXPORT_PADDING = 16;

export function embedAspectRatio(
  bounds: readonly [number, number, number, number] | null,
  padding = EMBED_EXPORT_PADDING,
): number {
  if (!bounds) return DEFAULT_EMBED_RATIO;
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return DEFAULT_EMBED_RATIO;
  return (width + padding * 2) / (height + padding * 2);
}

export function embedRatioKey(path: string, mtime: number): string {
  return JSON.stringify([path, mtime]);
}
