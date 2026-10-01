import { useEffect, useRef, type RefObject } from "react";

export type Anchor = { key: string; top: number };

export function alignedScroll(sourceTop: number, from: Anchor[], to: Anchor[], max: number) {
  const pairs = from
    .map((anchor) => ({
      source: anchor.top,
      target: to.find((other) => other.key === anchor.key)?.top,
    }))
    .filter((pair): pair is { source: number; target: number } => pair.target !== undefined)
    .sort((a, b) => a.source - b.source);
  if (!pairs.length) return Math.max(0, Math.min(max, sourceTop));
  const first = pairs[0];
  if (sourceTop <= first.source)
    return Math.max(0, Math.min(max, first.target + sourceTop - first.source));
  for (let index = 1; index < pairs.length; index++) {
    const right = pairs[index];
    if (sourceTop <= right.source) {
      const left = pairs[index - 1];
      const ratio = (sourceTop - left.source) / Math.max(1, right.source - left.source);
      return Math.max(0, Math.min(max, left.target + ratio * (right.target - left.target)));
    }
  }
  const last = pairs[pairs.length - 1];
  return Math.max(0, Math.min(max, last.target + sourceTop - last.source));
}

function headings(container: HTMLElement, selector: string): Anchor[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .map((node) => ({
      key: node.textContent?.replace(/^#{1,3}\s*/, "").trim() ?? "",
      top: node.offsetTop,
    }))
    .filter((anchor) => anchor.key.length > 0);
}

export function sourceHeadingAnchors(text: string, scrollHeight: number): Anchor[] {
  const lines = text.split("\n");
  return lines.flatMap((line, index) => {
    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    return heading
      ? [{ key: heading[1].trim(), top: (index / Math.max(1, lines.length - 1)) * scrollHeight }]
      : [];
  });
}

export function useScrollSync(
  editor: RefObject<HTMLDivElement | null>,
  preview: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  text: string,
) {
  const frame = useRef(0);
  const blocked = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const source = editor.current?.querySelector<HTMLElement>(".cm-scroller");
    const target = preview.current;
    if (!source || !target) return;
    const sync = (from: HTMLElement, to: HTMLElement, sourceSide: boolean) => {
      if (blocked.current === from) {
        blocked.current = null;
        return;
      }
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const fromAnchors = sourceSide
          ? sourceHeadingAnchors(text, source.scrollHeight)
          : headings(from, "h1,h2,h3");
        const toAnchors = sourceSide
          ? headings(to, "h1,h2,h3")
          : sourceHeadingAnchors(text, source.scrollHeight);
        blocked.current = to;
        to.scrollTop = alignedScroll(
          from.scrollTop,
          fromAnchors,
          toAnchors,
          to.scrollHeight - to.clientHeight,
        );
        frame.current = 0;
      });
    };
    const onSource = () => sync(source, target, true);
    const onTarget = () => sync(target, source, false);
    source.addEventListener("scroll", onSource);
    target.addEventListener("scroll", onTarget);
    return () => {
      source.removeEventListener("scroll", onSource);
      target.removeEventListener("scroll", onTarget);
      cancelAnimationFrame(frame.current);
    };
  }, [editor, preview, enabled, text]);
}
