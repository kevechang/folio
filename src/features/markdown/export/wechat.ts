import DOMPurify from "dompurify";
import { inlineLocalImages } from "./assets";
import { embeddedKatexCss } from "./html";

const styleProperties = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "color",
  "background-color",
  "text-align",
  "text-decoration",
  "white-space",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "list-style-type",
  "list-style-position",
  "vertical-align",
];

export function inlineStyles(source: HTMLElement, target: HTMLElement): void {
  const original = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [target, ...target.querySelectorAll<HTMLElement>("*")];
  for (let index = 0; index < original.length; index++) {
    const from = original[index];
    const to = copies[index];
    const computed = getComputedStyle(from);
    to.removeAttribute("class");
    to.removeAttribute("id");
    for (const attribute of Array.from(to.attributes))
      if (attribute.name.startsWith("data-") || attribute.name.startsWith("on"))
        to.removeAttribute(attribute.name);
    to.removeAttribute("style");
    for (const property of styleProperties) {
      const value = computed.getPropertyValue(property);
      if (value) to.style.setProperty(property, value);
    }
  }
}

function svgImage(svg: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(width * 2);
        canvas.height = Math.ceil(height * 2);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 不可用");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("SVG 无法载入"));
    image.src = url;
  });
}

async function rasterize(node: HTMLElement): Promise<{ src: string; width: number }> {
  const bounds = node.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(bounds.width));
  const height = Math.max(1, Math.ceil(bounds.height));
  if (node.classList.contains("folio-math")) {
    const css = await embeddedKatexCss();
    const content = `<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${node.innerHTML}</div>`;
    const src = await svgImage(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${content}</foreignObject></svg>`,
      width,
      height,
    );
    return { src, width };
  }
  const svg = node.querySelector("svg");
  if (!svg) throw new Error("SVG 不存在");
  const copy = svg.cloneNode(true) as SVGElement;
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return { src: await svgImage(new XMLSerializer().serializeToString(copy), width, height), width };
}

export async function buildWechatHtml(root: HTMLElement, documentPath: string | null) {
  const copy = root.cloneNode(true) as HTMLElement;
  const sourceNodes = Array.from(
    root.querySelectorAll<HTMLElement>(".folio-math,.folio-mermaid,.folio-chart,.folio-embed"),
  );
  const targetNodes = Array.from(
    copy.querySelectorAll<HTMLElement>(".folio-math,.folio-mermaid,.folio-chart,.folio-embed"),
  );
  inlineStyles(root, copy);
  let degradedMath = 0;
  let degradedDiagrams = 0;
  for (let index = 0; index < sourceNodes.length; index++) {
    const source = sourceNodes[index];
    const target = targetNodes[index];
    try {
      const image = document.createElement("img");
      const raster = await rasterize(source);
      image.src = raster.src;
      image.style.width = `${raster.width}px`;
      image.alt = source.classList.contains("folio-math") ? (source.dataset.tex ?? "公式") : "图示";
      if (source.tagName === "SPAN") image.style.verticalAlign = "middle";
      else {
        image.style.display = "block";
        image.style.margin = "0 auto";
      }
      target.replaceWith(image);
    } catch {
      if (source.classList.contains("folio-math")) degradedMath++;
      else degradedDiagrams++;
      target.replaceWith(document.createTextNode(source.dataset.tex ?? source.textContent ?? ""));
    }
  }
  for (const image of copy.querySelectorAll<HTMLImageElement>("img")) {
    if ((image.getAttribute("src") ?? "").startsWith("//"))
      image.setAttribute("src", `https:${image.getAttribute("src")}`);
    image.style.maxWidth = "100%";
    image.style.height = "auto";
  }
  for (const table of copy.querySelectorAll<HTMLTableElement>("table")) table.style.width = "100%";
  const { hasLargeImages, rejectedImages } = await inlineLocalImages(copy, documentPath, {
    limit: Number.POSITIVE_INFINITY,
  });
  const html = DOMPurify.sanitize(copy.outerHTML, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
  });
  return {
    html,
    text: root.textContent ?? "",
    degradedMath,
    degradedDiagrams,
    hasLargeImages,
    rejectedImages,
  };
}
