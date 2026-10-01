// @vitest-environment jsdom
import { readFile } from "node:fs/promises";
import { waitFor } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import mermaid from "mermaid";
import { renderMarkdown } from "../src/features/markdown/render/pipeline";
import {
  hydrateAll,
  hydrateMarkdown,
  prepareChartOption,
} from "../src/features/markdown/render/hydrate";
import { platform } from "../src/lib/platform";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>阅读</text><text>编辑</text></svg>',
    })),
  },
}));
vi.mock("@excalidraw/excalidraw", () => ({
  loadFromBlob: vi.fn(async () => ({ elements: [], files: {}, appState: {} })),
  getCommonBounds: vi.fn(() => [0, 0, 200, 100]),
  exportToSvg: vi.fn(async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 100");
    return svg;
  }),
}));

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("markdown local render pipeline", () => {
  it("hydrates every placeholder without an intersection observer", async () => {
    const root = document.createElement("article");
    root.innerHTML = await renderMarkdown("$x^2$\n\n```mermaid\ngraph LR; A-->B\n```", null);
    document.body.append(root);
    await hydrateAll(root, null, { theme: "light" });
    expect(root.querySelector(".katex")).not.toBeNull();
    expect(root.querySelector(".folio-mermaid svg")).not.toBeNull();
    expect(root.querySelector(".folio-skeleton")).toBeNull();
  });
  it("keeps diagrams lazy while rendering local KaTeX from the showcase", async () => {
    const sample = await readFile("docs/samples/markdown-showcase.md", "utf8");
    const html = await renderMarkdown(sample, "/docs/samples/markdown-showcase.md");
    expect(html).not.toMatch(/vercel\.app|mermaid\.ink/);
    const root = document.createElement("article");
    root.className = "folio-md";
    root.innerHTML = html;
    document.body.append(root);
    let show: ((entry: IntersectionObserverEntry[]) => void) | undefined;
    class Observer {
      constructor(callback: IntersectionObserverCallback) {
        show = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", Observer);
    const stop = hydrateMarkdown(root, null);
    expect(root.querySelector(".folio-mermaid.folio-skeleton svg")).toBeNull();
    const math = root.querySelector<HTMLElement>(".folio-math")!;
    const diagram = root.querySelector<HTMLElement>(".folio-mermaid")!;
    show?.([
      { target: math, isIntersecting: true },
      { target: diagram, isIntersecting: true },
    ] as IntersectionObserverEntry[]);
    await waitFor(() => expect(root.querySelector(".katex")).not.toBeNull());
    await waitFor(() =>
      expect(root.querySelector(".folio-mermaid svg")?.textContent).toBe("阅读编辑"),
    );
    expect(vi.mocked(mermaid.initialize)).toHaveBeenCalledWith(
      expect.objectContaining({
        htmlLabels: false,
        flowchart: { htmlLabels: false },
        look: "classic",
      }),
    );
    stop();
  });
  it("shows an error card for invalid chart JSON", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const root = document.createElement("article");
    root.className = "folio-md";
    root.innerHTML = await renderMarkdown("```echarts\n{bad json}\n```", null);
    document.body.append(root);
    const stop = hydrateMarkdown(root, null);
    const chart = root.querySelector(".folio-chart");
    expect(chart?.classList.contains("folio-render-error")).toBe(true);
    expect(chart?.textContent).toBe("图表配置不是合法 JSON");
    stop();
  });
  it("removes string formatters and forces rich text tooltips throughout chart JSON", () => {
    const { option, height } = prepareChartOption(
      JSON.stringify({
        height: 900,
        tooltip: { formatter: "{a}", renderMode: "html" },
        series: [
          { type: "bar", label: { formatter: "<b>{c}</b>" }, tooltip: { renderMode: "html" } },
        ],
      }),
    );
    expect(height).toBe(640);
    expect(option).not.toHaveProperty("height");
    expect(option.tooltip).toEqual({ renderMode: "richText" });
    expect(option.series).toEqual([
      { type: "bar", label: {}, tooltip: { renderMode: "richText" } },
    ]);
  });
  it("renders a local canvas as inline SVG and offers missing-file repair", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const stat = vi
      .spyOn(platform, "stat")
      .mockResolvedValueOnce({ mtime: 5, size: 10 })
      .mockResolvedValueOnce(null);
    vi.spyOn(platform, "readFile").mockResolvedValue(new Uint8Array([1]));
    const root = document.createElement("article");
    root.className = "folio-md";
    root.innerHTML = await renderMarkdown(
      '![画布](./a.excalidraw "标题")\n\n![缺失](./missing.excalidraw)',
      "/docs/book.md",
    );
    document.body.append(root);
    const stop = hydrateMarkdown(root, "/docs/book.md");
    await waitFor(() =>
      expect(root.querySelector("figure.folio-embed svg[viewBox]")).not.toBeNull(),
    );
    await waitFor(() => expect(root.querySelector(".folio-embed-repair")).not.toBeNull());
    expect(root.querySelector("figure.folio-embed figcaption")?.textContent).toBe("标题");
    expect(stat).toHaveBeenCalledWith("/docs/a.excalidraw");
    stop();
  });
});
