export type ReturnEntry = { path: string; name: string; scroll: number };

export function nextReturn(
  entry: ReturnEntry | null,
  closingPath: string | null,
): ReturnEntry | null {
  return entry && closingPath && closingPath !== entry.path ? entry : null;
}
