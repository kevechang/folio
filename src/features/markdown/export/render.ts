import { renderMarkdown } from "../render/pipeline";
import { hydrateAll } from "../render/hydrate";
import { lightTokens } from "./light-tokens";

export async function renderForExport(text: string, documentPath: string | null) {
  const host = document.createElement("div");
  host.className = "penna-theme-default folio-md-reader-host folio-export-host";
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;visibility:hidden;pointer-events:none;color-scheme:light;--folio-md-width:720px";
  const style = document.createElement("style");
  style.textContent = lightTokens(".folio-export-host");
  const penna = document.createElement("div");
  penna.className = "penna";
  const body = document.createElement("div");
  body.className = "penna-body";
  const preview = document.createElement("div");
  preview.className = "penna-preview folio-md-reader";
  const root = document.createElement("article");
  root.className = "penna-render folio-md";
  const template = document.createElement("template");
  template.innerHTML = await renderMarkdown(text, documentPath);
  for (const image of template.content.querySelectorAll<HTMLImageElement>("img")) {
    const src = image.getAttribute("src") ?? "";
    if (src.startsWith("//")) image.setAttribute("src", `https:${src}`);
    else if (/^blob:/i.test(src)) image.replaceWith(document.createTextNode(image.alt || ""));
  }
  for (const node of template.content.querySelectorAll<SVGElement>("svg *"))
    for (const attribute of ["href", "xlink:href"])
      if (/^(?:https?:|\/\/)/i.test(node.getAttribute(attribute) ?? ""))
        node.removeAttribute(attribute);
  root.append(template.content);
  preview.append(root);
  body.append(preview);
  penna.append(body);
  host.append(style, penna);
  document.body.append(host);
  try {
    await hydrateAll(root, documentPath, { theme: "light" });
    root
      .querySelectorAll(".folio-md-code-copy,.folio-embed-open,.folio-embed-repair")
      .forEach((node) => node.remove());
    return { host, root };
  } catch (error) {
    host.remove();
    throw error;
  }
}
