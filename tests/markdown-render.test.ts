// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/lib/markdown";

describe("markdown rendering", () => {
  it.each([
    ["flowchart", "flowchart LR; A[Start] --> B[Finish]"],
    ["sequence", "sequenceDiagram\nAlice->>Bob: Hello"],
  ])("renders a real Mermaid %s with its default layout", async (name, code) => {
    // jsdom has no SVG geometry engine; provide measurements, keeping Mermaid real.
    const descriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
    const lengthDescriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      "getComputedTextLength",
    );
    Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
      configurable: true,
      value: function (this: SVGElement) {
        return (this.textContent?.length ?? 0) * 8;
      },
    });
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 100, height: 24 }),
    });
    try {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });
      const { svg } = await mermaid.render(`folio-test-${name}`, code);
      expect(svg).toContain("<svg");
      expect(svg).toContain(name === "flowchart" ? "Start" : "Hello");
    } finally {
      if (descriptor) Object.defineProperty(SVGElement.prototype, "getBBox", descriptor);
      else Reflect.deleteProperty(SVGElement.prototype, "getBBox");
      if (lengthDescriptor)
        Object.defineProperty(SVGElement.prototype, "getComputedTextLength", lengthDescriptor);
      else Reflect.deleteProperty(SVGElement.prototype, "getComputedTextLength");
      document.body.replaceChildren();
    }
  });

  it("rejects the excluded ELK layout through the aliased module", async () => {
    const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
    await expect(new ELK().layout({ id: "root" })).rejects.toThrow(
      "ELK layout is not available in Folio builds",
    );
  });

  it("renders a heading and local render placeholders", async () => {
    const html = await renderMarkdown(
      "# 标题\n\n$E=mc^2$\n\n```mermaid\ngraph TD\nA-->B\n```\n\n![画布](./frames.excalidraw)",
    );
    const root = document.createElement("div");
    root.innerHTML = html;
    expect(root.querySelector("h1")?.textContent).toBe("标题");
    expect(root.querySelector(".folio-math")?.getAttribute("data-tex")).toBe("E=mc^2");
    expect(root.querySelector(".folio-mermaid")?.getAttribute("data-code")).toContain("A-->B");
    expect(root.querySelector(".folio-embed")?.getAttribute("data-path")).toBe(
      "./frames.excalidraw",
    );
    expect(html).not.toMatch(/math-api-delta|mermaid\.ink|echarts-api/);
  });
  it("removes script, event handlers and javascript links", async () => {
    const html = await renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<a href="javascript:alert(1)">bad</a>',
    );
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });
  it("keeps adjacent inline formulas inside their paragraph", async () => {
    const html = await renderMarkdown("文字 $a$ 和 $b$ 收尾");
    const root = document.createElement("div");
    root.innerHTML = html;
    expect(root.querySelectorAll("p .folio-math")).toHaveLength(2);
    expect(root.querySelector("p")?.textContent).toContain("收尾");
  });
  it("rewrites relative local images to the guarded protocol", async () => {
    const html = await renderMarkdown("![插图](./images/a.png)", "/docs/book/a.md");
    expect(html).toContain("folio-asset://local/docs/book/images/a.png");
  });
  it("does not retain a remote rendering image URL", async () => {
    const html = await renderMarkdown("![图](https://mermaid.ink/img/test)");
    expect(html).not.toContain("mermaid.ink");
    expect(html).toContain("不支持的远程渲染");
  });
  it("adds local code highlighting without a rendering service", async () => {
    const html = await renderMarkdown("```js\nconst answer = 42;\n```");
    expect(html).toContain("hljs-keyword");
    expect(html).not.toMatch(/math-api-delta|mermaid\.ink|echarts-api/);
  });
  it("keeps charts as local render placeholders", async () => {
    const html = await renderMarkdown('```echarts\n{"series": []}\n```');
    expect(html).toContain('class="folio-chart folio-skeleton"');
    expect(html).toContain('data-code="{&quot;series&quot;: []}');
    expect(html).not.toMatch(/vercel\.app|mermaid\.ink/);
  });
  it("preserves Penna reading elements and adds only code controls", async () => {
    const html = await renderMarkdown(
      "# 章节\n\n*中文强调*\n\n![图注](./a.png)\n\n```js\nlet x = 1;\n```",
    );
    const root = document.createElement("div");
    root.innerHTML = html;
    expect(root.querySelector("h1")?.textContent).toBe("章节");
    expect(root.querySelector("em")?.className).toBe("");
    expect(root.querySelector("img")?.getAttribute("alt")).toBe("图注");
    expect(root.querySelector(".folio-md-code-copy")?.getAttribute("aria-label")).toBe("复制代码");
  });
});
