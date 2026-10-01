import DOMPurify from "dompurify";
import { resolveRelativePath } from "./paths";
import { parseEmbed } from "./embed";

function placeholders(source: string) {
  const nodes: { kind: string; value: string; display?: boolean; alt?: string; title?: string }[] =
    [];
  const mark = (kind: string, value: string, display = false, alt = "", title = "") => {
    const token = `FOLIOPLACEHOLDER${nodes.length}END`;
    nodes.push({ kind, value, display, alt, title });
    return kind === "math" && !display ? token : `\n\n${token}\n\n`;
  };
  const text = source
    .replace(
      /^```\s*(mermaid|graph|echarts)\b[^\n]*\n([\s\S]*?)^```\s*$/gim,
      (_, type: string, code: string) =>
        mark(type.toLowerCase() === "echarts" ? "chart" : "mermaid", code),
    )
    .replace(/^\$\$\s*\n?([\s\S]*?)\n?\$\$\s*$/gm, (_, tex: string) => mark("math", tex, true))
    .replace(/\$([^$\n]+)\$/g, (_, tex: string) => mark("math", tex))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match: string, alt: string, target: string) => {
      const embed = parseEmbed(target);
      return embed ? mark("embed", embed.path, false, alt, embed.title) : match;
    });
  return { text, nodes };
}

export async function renderMarkdown(text: string, documentPath?: string | null): Promise<string> {
  const { TransformerEngine } = await import("penna-markdown/transformer");
  const { text: safeSource, nodes } = placeholders(text);
  const engine = new TransformerEngine({
    syntaxOptions: {
      math_block: { apiHost: "" },
      code: { mermaidApiHost: "", echartsApiHost: "" },
    },
  });
  const html = engine.render(engine.parse(safeSource));
  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc", "style", "srcset"],
  });
  const template = document.createElement("template");
  template.innerHTML = clean;
  const iterator = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const tokens: Text[] = [];
  while (iterator.nextNode()) {
    const node = iterator.currentNode as Text;
    if (/FOLIOPLACEHOLDER\d+END/.test(node.textContent ?? "")) tokens.push(node);
  }
  for (const token of tokens) {
    const match = /FOLIOPLACEHOLDER(\d+)END/.exec(token.textContent ?? "");
    const spec = match && nodes[Number(match[1])];
    if (!spec) continue;
    const wrapper = document.createElement(spec.kind === "math" && !spec.display ? "span" : "div");
    wrapper.className = `folio-${spec.kind}`;
    wrapper.classList.add("folio-skeleton");
    if (spec.kind === "math") {
      wrapper.dataset.tex = spec.value;
      if (spec.display) wrapper.dataset.display = "";
    } else if (spec.kind === "mermaid" || spec.kind === "chart") wrapper.dataset.code = spec.value;
    else {
      wrapper.dataset.path = spec.value;
      wrapper.dataset.caption = spec.title || spec.alt;
      wrapper.textContent = spec.title || spec.alt || "画布";
    }
    const value = token.textContent ?? "";
    const before = value.slice(0, match!.index);
    const after = value.slice(match!.index + match![0].length);
    if (
      token.parentElement?.tagName === "P" &&
      !before.trim() &&
      !after.trim() &&
      wrapper.tagName === "DIV"
    )
      token.parentElement.replaceWith(wrapper);
    else {
      const tail = document.createTextNode(after);
      token.replaceWith(document.createTextNode(before), wrapper, tail);
      if (/FOLIOPLACEHOLDER\d+END/.test(after)) tokens.push(tail);
    }
  }
  const { default: highlight } = await import("highlight.js");
  for (const code of template.content.querySelectorAll("pre code")) {
    const language = Array.from(code.classList)
      .find((value) => value.startsWith("language-"))
      ?.slice(9);
    const source = code.textContent ?? "";
    const result =
      language && highlight.getLanguage(language)
        ? highlight.highlight(source, { language })
        : highlight.highlightAuto(source);
    code.innerHTML = DOMPurify.sanitize(result.value);
    code.classList.add("hljs");
    const copy = document.createElement("button");
    copy.className = "folio-md-code-copy";
    copy.type = "button";
    copy.textContent = "⧉";
    copy.setAttribute("aria-label", "复制代码");
    code.parentElement?.append(copy);
  }
  for (const image of template.content.querySelectorAll("img")) {
    const src = image.getAttribute("src") ?? "";
    if (/^(?:https?:)?\/\//i.test(src)) {
      const hostname = new URL(src, "https://folio.local").hostname;
      if (
        (hostname.endsWith(".vercel.app") || hostname.endsWith(".ink")) &&
        /^(?:math-api-delta|mermaid|echarts-api)\./.test(hostname)
      ) {
        const card = document.createElement("span");
        card.className = "folio-render-error";
        card.textContent = "不支持的远程渲染";
        image.replaceWith(card);
        continue;
      }
    }
    if (
      documentPath &&
      src &&
      !/^(https:|data:|blob:|folio-asset:)/i.test(src) &&
      !src.startsWith("/")
    ) {
      image.src = `folio-asset://local${resolveRelativePath(documentPath, src)}`;
    } else if (!/^(https:|data:|blob:|folio-asset:)/i.test(src)) image.removeAttribute("src");
  }
  return template.innerHTML;
}
