export type DocumentKind = "canvas" | "markdown";

export interface DocumentAdapter<M> {
  kind: DocumentKind;
  extensions: string[];
  load(bytes: Uint8Array, path: string | null): Promise<M>;
  serialize(model: M): Uint8Array;
  fingerprint(model: M): string;
  empty(): M;
}

export const markdownAdapter: DocumentAdapter<string> = {
  kind: "markdown",
  extensions: [".md", ".markdown"],
  load: async (bytes) => new TextDecoder().decode(bytes),
  serialize: (text) => new TextEncoder().encode(text),
  fingerprint: (text) => {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  },
  empty: () => "",
};

export function markdownMetadata(text: string, fallback: string) {
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>*\-+\d.\s]+/gm, "")
    .replace(/[*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const cjk =
    plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length ?? 0;
  const latin = plain.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return {
    title,
    excerpt: plain.slice(0, 160),
    words: cjk + latin,
    minutes: Math.max(1, Math.ceil(cjk / 400 + latin / 220)),
  };
}

export type LinkKind = "anchor" | "external" | "document" | "unsupported";
export function classifyMarkdownLink(value: string): LinkKind {
  if (/^#[^#]/.test(value)) return "anchor";
  if (/^(https?:|mailto:)/i.test(value)) return "external";
  if (!/^[a-z][\w+.-]*:/i.test(value) && /\.(md|markdown|excalidraw)(?:#.*)?$/i.test(value))
    return "document";
  return "unsupported";
}

export { resolveRelativePath } from "../features/markdown/render/paths";

export function relativeDocumentPath(documentPath: string, targetPath: string) {
  const from = documentPath.replace(/\\/g, "/").split("/").slice(0, -1);
  const to = targetPath.replace(/\\/g, "/").split("/");
  while (from.length && to.length && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return [...from.map(() => ".."), ...to].join("/") || ".";
}

export function scrollSpyIndex(tops: number[], threshold = 120) {
  return tops.reduce((found, top, index) => (top <= threshold ? index : found), 0);
}

export { renderMarkdown } from "../features/markdown/render/pipeline";
