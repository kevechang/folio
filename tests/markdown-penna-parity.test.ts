// @vitest-environment jsdom
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Penna } from "penna-markdown";
import { TransformerEngine } from "penna-markdown/transformer";
import { MarkdownReader } from "../src/features/markdown/MarkdownReader";
import { MarkdownPreview } from "../src/features/markdown/MarkdownPreview";
import { renderMarkdown } from "../src/features/markdown/render/pipeline";

function classChain(element: Element) {
  const chain: string[][] = [];
  for (let node: Element | null = element; node; node = node.firstElementChild) {
    chain.push(Array.from(node.classList).filter((name) => name.startsWith("penna")));
    if (node.classList.contains("penna-render")) break;
  }
  return chain;
}

describe("Penna reading structure parity", () => {
  it("uses Penna's real preview class chain in reader and editor preview", async () => {
    Range.prototype.getClientRects = () => document.createElement("span").getClientRects();
    Range.prototype.getBoundingClientRect = () => new DOMRect();
    const sample = await readFile("docs/samples/markdown-showcase.md", "utf8");
    const mount = document.createElement("div");
    document.body.append(mount);
    const penna = new Penna(mount, {
      layout: "split",
      toolbar: false,
      sidebar: false,
      statusbar: false,
      editor: { value: sample },
    });
    const pennaRender = mount.querySelector(".penna-preview .penna-render")!;
    const expected = [
      Array.from(mount.classList),
      Array.from(mount.querySelector(".penna")!.classList),
      Array.from(mount.querySelector(".penna-body")!.classList).filter(
        (name) => name === "penna-body",
      ),
      Array.from(pennaRender.parentElement!.classList),
      Array.from(pennaRender.classList),
    ];
    const html = await renderMarkdown(sample, "/docs/samples/markdown-showcase.md");
    for (const Component of [MarkdownReader, MarkdownPreview]) {
      const props = {
        html,
        path: "/docs/samples/markdown-showcase.md",
        scrollRef: { current: null },
        onClick: () => {},
        position: 0,
        onScroll: () => {},
      };
      const host = document.createElement("div");
      host.innerHTML = renderToStaticMarkup(createElement(Component, props));
      const render = host.querySelector(".penna-render")!;
      const actual = [
        Array.from(host.firstElementChild!.classList).filter((name) => name.startsWith("penna")),
        ...classChain(host.firstElementChild!.firstElementChild!).slice(0, 3),
        Array.from(render.classList).filter((name) => name.startsWith("penna")),
      ];
      expect(actual).toEqual(expected);
      for (const node of render.querySelectorAll("h1,h2,h3,p,blockquote,ul,ol,table,hr,img,em")) {
        expect(Array.from(node.classList).filter((name) => !name.startsWith("penna"))).toEqual([]);
      }
      expect(render.querySelector("th[align=right]")).not.toBeNull();
      expect(render.querySelector(".penna-alert")).not.toBeNull();
      expect(render.querySelector(".folio-md-code-copy")).not.toBeNull();
    }
    const engine = new TransformerEngine();
    const pennaHtml = engine.render(engine.parse(sample));
    expect(pennaHtml).toContain("<blockquote>");
    expect(html).toContain("<blockquote>");
    penna.destroy();
    mount.remove();
  });
});
