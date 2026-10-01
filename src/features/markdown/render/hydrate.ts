import DOMPurify from "dompurify";
import { renderChart } from "./chart";
import { platform } from "../../../lib/platform";
import { embedCacheKey } from "./embed";
import { resolveRelativePath } from "./paths";
import { EMBED_EXPORT_PADDING, embedAspectRatio, embedRatioKey } from "./embed-ratio";
export { prepareChartOption } from "./chart";
const diagrams = new Map<string, string>();
const canvases = new Map<string, string>();
const ratios = new Map<string, number>();
const latestRatios = new Map<string, number>();
let sequence = 0;
function errorCard(element: HTMLElement, message: string) {
  element.classList.remove("folio-skeleton");
  element.classList.add("folio-render-error");
  element.textContent = message;
}

async function renderMath(element: HTMLElement) {
  try {
    const [{ default: katex }] = await Promise.all([
      import("katex"),
      import("katex/dist/katex.min.css"),
    ]);
    if (!element.isConnected) return;
    katex.render(element.dataset.tex ?? "", element, {
      throwOnError: false,
      displayMode: element.hasAttribute("data-display"),
      output: "htmlAndMathml",
    });
    element.classList.remove("folio-skeleton");
    element.classList.add("folio-ready");
  } catch (error) {
    errorCard(element, `公式渲染失败：${String(error)}`);
  }
}

async function renderMermaid(element: HTMLElement, dark: boolean) {
  const code = element.dataset.code ?? "";
  const key = embedCacheKey(code, 0, dark ? "dark" : "light");
  try {
    let svg = diagrams.get(key);
    if (!svg) {
      const { default: mermaid } = await import("mermaid");
      const tokens = getComputedStyle(element);
      const color = (name: string) => tokens.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        htmlLabels: false,
        look: "classic",
        flowchart: { htmlLabels: false },
        theme: "base",
        themeVariables: {
          fontFamily: color("--font-ui"),
          primaryColor: color("--paper-elevated"),
          primaryBorderColor: color("--ink-3"),
          primaryTextColor: color("--ink"),
          lineColor: color("--ink-3"),
          secondaryColor: color("--accent-soft"),
          tertiaryColor: color("--paper-sunken"),
          noteBkgColor: color("--manilla"),
        },
      });
      svg = (await mermaid.render(`folio-diagram-${++sequence}`, code)).svg;
      diagrams.set(key, svg);
    }
    if (!element.isConnected) return;
    element.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    element.classList.remove("folio-skeleton");
    element.classList.add("folio-ready");
  } catch (error) {
    errorCard(element, `流程图渲染失败：${String(error)}`);
  }
}

export async function hydrateAll(
  root: HTMLElement,
  documentPath: string | null,
  _options: { theme: "light" },
): Promise<void> {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(".folio-math,.folio-mermaid,.folio-chart,.folio-embed"),
  );
  for (const node of nodes) {
    if (node.classList.contains("folio-math")) await renderMath(node);
    else if (node.classList.contains("folio-mermaid")) await renderMermaid(node, false);
    else if (node.classList.contains("folio-chart")) {
      const dispose = await renderChart(node, false);
      const svg = node.querySelector("svg")?.cloneNode(true);
      dispose();
      if (svg) node.replaceChildren(svg);
    } else if (documentPath) await renderEmbed(node, documentPath, false);
    else errorCard(node, "请先保存文稿以加载画布");
  }
}

async function renderEmbed(element: HTMLElement, documentPath: string, dark: boolean) {
  const path = resolveRelativePath(documentPath, element.dataset.path ?? "");
  const knownRatio = latestRatios.get(path);
  if (knownRatio) element.style.aspectRatio = String(knownRatio);
  const stat = await platform.stat(path).catch(() => null);
  if (!stat) {
    errorCard(element, `找不到画布“${path.split("/").pop()}”`);
    repairLink(element);
    return;
  }
  const key = embedCacheKey(path, stat.mtime, dark ? "dark" : "light");
  const ratioKey = embedRatioKey(path, stat.mtime);
  const cachedRatio = ratios.get(ratioKey);
  if (cachedRatio) element.style.aspectRatio = String(cachedRatio);
  try {
    let svg = canvases.get(key);
    if (!svg) {
      const bytes = await platform.readFile(path);
      const { loadFromBlob, exportToSvg, getCommonBounds } = await import("@excalidraw/excalidraw");
      const mime = path.toLowerCase().endsWith(".png")
        ? "image/png"
        : path.toLowerCase().endsWith(".svg")
          ? "image/svg+xml"
          : "application/vnd.excalidraw+json";
      const scene = await loadFromBlob(
        new Blob([new Uint8Array(bytes)], { type: mime }),
        null,
        null,
      );
      const elements = scene.elements.filter((item) => !item.isDeleted);
      const ratio = embedAspectRatio(elements.length ? getCommonBounds(elements) : null);
      ratios.set(ratioKey, ratio);
      latestRatios.set(path, ratio);
      element.style.aspectRatio = String(ratio);
      const rendered = await exportToSvg({
        elements,
        files: scene.files,
        appState: { ...scene.appState, exportBackground: true, exportWithDarkMode: false },
        exportPadding: EMBED_EXPORT_PADDING,
      });
      svg = new XMLSerializer().serializeToString(rendered);
      canvases.set(key, svg);
    }
    if (!element.isConnected) return;
    const figure = document.createElement("figure");
    figure.className = "folio-embed folio-ready";
    figure.dataset.path = path;
    figure.dataset.source = element.dataset.path;
    figure.dataset.cacheKey = key;
    figure.style.aspectRatio = String(ratios.get(ratioKey) ?? knownRatio ?? 16 / 9);
    const art = document.createElement("div");
    art.className = `folio-embed-art${dark ? " is-dark" : ""}`;
    art.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    const button = document.createElement("button");
    button.className = "folio-embed-open";
    button.textContent = "在 Folio 中打开";
    const caption = document.createElement("figcaption");
    caption.textContent = element.dataset.caption ?? "";
    figure.append(art, button, caption);
    element.replaceWith(figure);
  } catch {
    errorCard(element, "无法读取这张画布");
    repairLink(element);
  }
}

function repairLink(element: HTMLElement) {
  const button = document.createElement("button");
  button.className = "folio-embed-repair";
  button.textContent = "选择文件…";
  element.append(button);
}

export function hydrateMarkdown(root: HTMLElement, documentPath: string | null): () => void {
  const dark = document.documentElement.dataset.theme === "dark";
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(".folio-math,.folio-mermaid,.folio-chart,.folio-embed"),
  );
  let observer: IntersectionObserver | null = null;
  const charts = new Map<HTMLElement, () => void>();
  const render = (node: HTMLElement) => {
    if (node.classList.contains("folio-math")) void renderMath(node);
    else if (node.classList.contains("folio-mermaid")) void renderMermaid(node, dark);
    else if (node.classList.contains("folio-chart"))
      void renderChart(node, dark).then((dispose) => charts.set(node, dispose));
    else if (documentPath) void renderEmbed(node, documentPath, dark);
    else errorCard(node, "请先保存文稿以加载画布");
  };
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            observer?.unobserve(entry.target);
            render(entry.target as HTMLElement);
          }
      },
      { root: root.closest(".folio-md-reader,.folio-md-preview") },
    );
    for (const node of nodes) observer.observe(node);
  } else nodes.forEach(render);
  const refresh = () => {
    if (!documentPath) return;
    for (const figure of root.querySelectorAll<HTMLElement>("figure.folio-embed")) {
      const path = figure.dataset.path;
      if (!path) continue;
      void platform
        .stat(path)
        .then((stat) => {
          const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
          if (
            !figure.isConnected ||
            (stat && figure.dataset.cacheKey === embedCacheKey(path, stat.mtime, theme))
          )
            return;
          const placeholder = document.createElement("div");
          placeholder.className = "folio-embed folio-skeleton";
          placeholder.dataset.path = figure.dataset.source;
          placeholder.dataset.caption = figure.querySelector("figcaption")?.textContent ?? "";
          figure.replaceWith(placeholder);
          void renderEmbed(placeholder, documentPath, theme === "dark");
        })
        .catch(() => {});
    }
  };
  const themeObserver = new MutationObserver(() => {
    refresh();
    for (const diagram of root.querySelectorAll<HTMLElement>(".folio-mermaid.folio-ready")) {
      diagram.replaceChildren();
      diagram.classList.add("folio-skeleton");
      void renderMermaid(diagram, document.documentElement.dataset.theme === "dark");
    }
    for (const [chart, dispose] of charts) {
      dispose();
      chart.replaceChildren();
      chart.classList.add("folio-skeleton");
      void renderChart(chart, document.documentElement.dataset.theme === "dark").then((next) =>
        charts.set(chart, next),
      );
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("focus", refresh);
  return () => {
    observer?.disconnect();
    for (const dispose of charts.values()) dispose();
    themeObserver.disconnect();
    window.removeEventListener("focus", refresh);
  };
}
