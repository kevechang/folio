export function updateBaseline(
  baseline: string,
  fingerprint: string,
  isNew: boolean,
): { baseline: string; dirty: boolean } {
  const next = isNew && baseline === "" ? fingerprint : baseline;
  return { baseline: next, dirty: fingerprint !== next };
}

export function draftCloseAction(
  dirty: boolean,
  hasInitial: boolean,
): "persist" | "keep" | "delete" {
  if (dirty) return "persist";
  return hasInitial ? "keep" : "delete";
}
