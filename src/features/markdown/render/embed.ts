export function parseEmbed(target: string): { path: string; title: string } | null {
  const match = /^([^\s]+?)(?:\s+["']([^"']*)["'])?$/.exec(target.trim());
  if (!match || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(match[1])) return null;
  if (!/\.excalidraw(?:\.(?:png|svg))?$/i.test(match[1])) return null;
  return { path: match[1], title: match[2] ?? "" };
}

export function embedCacheKey(path: string, mtime: number, theme: string): string {
  return JSON.stringify([path, mtime, theme]);
}
