import DOMPurify from "dompurify";
import pennaCss from "penna-markdown/transformer.css?inline";
import bridgeCss from "../theme/penna-bridge.css?inline";
import renderCss from "../theme/render.css?inline";
import katexCss from "katex/dist/katex.min.css?inline";
import { base64, inlineLocalImages } from "./assets";
import { lightTokens } from "./light-tokens";

const fonts = import.meta.glob("/node_modules/katex/dist/fonts/*.woff2", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function documentTitle(root: HTMLElement, fallback: string): string {
  return root.querySelector("h1")?.textContent?.trim() || fallback;
}

function lightRules(css: string): string {
  return css.replace(/[^{}]*\.penna-dark[^{}]*\{[^{}]*\}/g, "");
}

let katexCssPromise: Promise<string> | null = null;

async function createEmbeddedKatexCss(): Promise<string> {
  let css = katexCss.replace(/,url\([^)]*\) format\("(?:woff|truetype)"\)/g, "");
  for (const [path, asset] of Object.entries(fonts)) {
    const logical = path.replace("/node_modules/katex/dist/", "");
    if (!css.includes(asset) && !css.includes(logical)) continue;
    const response = await fetch(asset);
    if (!response.ok) throw new Error(`KaTeX 字体读取失败：${logical}`);
    const uri = `data:font/woff2;base64,${base64(new Uint8Array(await response.arrayBuffer()))}`;
    css = css.replaceAll(asset, uri).replaceAll(logical, uri);
  }
  if (/url\([^)]*\.woff2/.test(css)) throw new Error("KaTeX 字体未能内联");
  return css;
}

export function embeddedKatexCss(): Promise<string> {
  if (!katexCssPromise)
    katexCssPromise = createEmbeddedKatexCss().catch((error: unknown) => {
      katexCssPromise = null;
      throw error;
    });
  return katexCssPromise;
}

const printCss = `@media print{pre,table,img,figure{break-inside:avoid}h1,h2,h3,h4,h5,h6{break-after:avoid}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

export async function buildStandaloneHtml(
  root: HTMLElement,
  options: {
    title: string;
    documentPath?: string | null;
    exportTargetPath?: string | null;
    format?: "html" | "pdf";
  },
) {
  const article = root.cloneNode(true) as HTMLElement;
  const hasMath = Boolean(article.querySelector(".folio-math"));
  const title = documentTitle(article, options.title);
  const images = await inlineLocalImages(article, options.exportTargetPath ?? null, {
    format: options.format,
  });
  for (const image of article.querySelectorAll("img")) {
    const src = image.getAttribute("src") ?? "";
    if (src.startsWith("//")) image.setAttribute("src", `https:${src}`);
    else if (/^blob:/i.test(src)) image.replaceWith(document.createTextNode(image.alt || ""));
  }
  for (const node of article.querySelectorAll<HTMLElement | SVGElement>("*")) {
    for (const attribute of ["src", "href", "xlink:href"])
      if (
        node instanceof SVGElement &&
        /^(?:https?:|\/\/|blob:)/i.test(node.getAttribute(attribute) ?? "")
      )
        node.removeAttribute(attribute);
  }
  const safe = DOMPurify.sanitize(article.outerHTML, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc", "onload", "onerror"],
  });
  const css = [
    lightTokens(),
    lightRules(pennaCss),
    lightRules(bridgeCss),
    renderCss,
    hasMath ? await embeddedKatexCss() : "",
    `:root{color-scheme:light}body{margin:0;background:var(--paper);color:var(--ink)}.penna .penna-render.folio-md{--folio-md-width:720px;max-width:720px;transition:none}.folio-ready{animation:none}`,
    printCss,
  ].join("\n");
  const escapedTitle = title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return {
    html: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapedTitle}</title><style>${css}</style></head><body><div class="penna-theme-default folio-md-reader-host"><div class="penna"><div class="penna-body"><div class="penna-preview folio-md-reader">${safe}</div></div></div></div></body></html>`,
    title,
    ...images,
  };
}
