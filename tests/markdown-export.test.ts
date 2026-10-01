// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStandaloneHtml, documentTitle } from "../src/features/markdown/export/html";
import { buildWechatHtml, inlineStyles } from "../src/features/markdown/export/wechat";
import { renderForExport } from "../src/features/markdown/export/render";
import { lightTokens } from "../src/features/markdown/export/light-tokens";
import { platform } from "../src/lib/platform";

vi.mock("../src/features/markdown/render/pipeline", () => ({
  renderMarkdown: vi.fn(async () => '<p><img src="https://picgo.example/a.png" alt="远程"></p>'),
}));
vi.mock("../src/features/markdown/render/hydrate", () => ({
  hydrateAll: vi.fn(async () => {}),
}));

vi.mock("../src/styles/tokens.css?inline", () => ({
  default:
    ':root,[data-theme="light"]{--paper:#faf9f5;--kraft:#d4a27f;--accent-ink:#b85a3b;--font-mono:Menlo,monospace}@property --text-scale{syntax:"<number>"}',
}));
vi.mock("penna-markdown/transformer.css?inline", () => ({
  default: ".penna-render{color:var(--ink)}",
}));
vi.mock("../src/features/markdown/theme/penna-bridge.css?inline", () => ({
  default: ".folio-md{color:var(--ink)}",
}));
vi.mock("../src/features/markdown/theme/render.css?inline", () => ({
  default: ".folio-ready{opacity:1}",
}));
vi.mock("katex/dist/katex.min.css?inline", () => ({
  default:
    '@font-face{font-family:KaTeX_Main;src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2"),url(fonts/KaTeX_Main-Regular.woff) format("woff")}',
}));

function article(html: string) {
  const root = document.createElement("article");
  root.className = "penna-render folio-md";
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("standalone HTML", () => {
  it("uses complete light tokens even when the UI is dark", async () => {
    document.documentElement.dataset.theme = "dark";
    const { host, root } = await renderForExport("remote", null);
    expect(host.querySelector("style")?.textContent).toBe(lightTokens(".folio-export-host"));
    expect(host.querySelector("style")?.textContent).toContain("--kraft:#d4a27f");
    expect(host.querySelector("style")?.textContent).toContain("--accent-ink:#b85a3b");
    expect(host.querySelector("style")?.textContent).toContain("--font-mono:Menlo,monospace");
    expect(root.querySelector("img")?.getAttribute("src")).toBe("https://picgo.example/a.png");
    host.remove();
    delete document.documentElement.dataset.theme;
  });
  it("uses the first h1, omits scripts and fixes the light layout", async () => {
    const root = article(
      '<h1>文稿标题</h1><p onclick="alert(1)">正文</p><script>alert(1)</script><a href="javascript:alert(1)">链接</a>',
    );
    const result = await buildStandaloneHtml(root, { title: "文件名" });
    expect(documentTitle(root, "文件名")).toBe("文稿标题");
    expect(result.title).toBe("文稿标题");
    expect(result.html).toMatch(/^<!doctype html>/);
    expect(result.html).not.toMatch(/<script|onclick=|javascript:/i);
    expect(result.html).not.toContain("KaTeX_Main-Regular.woff2");
    expect(result.html).toContain("--paper:#faf9f5");
    expect(result.html).toContain("--folio-md-width:720px");
    expect(documentTitle(article("<p>正文</p>"), "文件名")).toBe("文件名");
  });
  it("inlines local images, with a total-size fallback", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    vi.spyOn(platform, "readAsset").mockResolvedValue(bytes);
    const root = article('<img src="folio-asset://local/docs/assets/a.png" alt="图">');
    const small = await buildStandaloneHtml(root, { title: "A", documentPath: "/docs/a.md" });
    expect(small.html).toContain("data:image/png;base64,AQID");
    expect(small.html).not.toContain("folio-asset:");
    vi.spyOn(platform, "readAsset").mockResolvedValue(new Uint8Array(21 * 1024 * 1024));
    const large = await buildStandaloneHtml(root, {
      title: "A",
      documentPath: "/docs/a.md",
      exportTargetPath: "/exports/html/a.html",
      format: "html",
    });
    expect(large.imagesKept).toBe(true);
    expect(large.html).toContain('src="../../docs/assets/a.png"');
  });
  it("keeps PDF images inline even above the HTML size limit", async () => {
    vi.spyOn(platform, "readAsset").mockResolvedValue(new Uint8Array(21 * 1024 * 1024));
    const result = await buildStandaloneHtml(
      article('<img src="folio-asset://local/docs/assets/a.png">'),
      { title: "A", exportTargetPath: "/exports/a.pdf", format: "pdf" },
    );
    expect(result.imagesKept).toBe(false);
    expect(result.rejectedImages).toBe(0);
    expect(result.html).toContain('src="data:image/png;base64,');
    expect(result.html).not.toContain("folio-asset:");
  });
  it("exposes rejected images without leaving local sources in standalone HTML", async () => {
    vi.spyOn(platform, "readAsset").mockResolvedValue(null);
    const result = await buildStandaloneHtml(
      article('<img src="folio-asset://local/private.png" alt="拒绝">'),
      { title: "A" },
    );
    expect(result.rejectedImages).toBe(1);
    expect(result.html).toContain('<img alt="拒绝">');
  });
  it("embeds KaTeX CSS and WOFF2 data only when math is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2]))),
    );
    const result = await buildStandaloneHtml(
      article('<span class="folio-math" data-tex="x">x</span>'),
      { title: "A" },
    );
    expect(result.html).toContain("data:font/woff2;base64,AQI=");
    expect(result.html).not.toContain("KaTeX_Main-Regular.woff)");
    await buildStandaloneHtml(article('<span class="folio-math" data-tex="y">y</span>'), {
      title: "B",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps remote images, normalizes protocol-relative URLs and removes blob images", async () => {
    const result = await buildStandaloneHtml(
      article(
        '<img src="https://picgo.example/a.png"><img src="//upic.example/b.png"><img src="blob:local" alt="临时">',
      ),
      { title: "A" },
    );
    expect(result.html).toContain('src="https://picgo.example/a.png"');
    expect(result.html).toContain('src="https://upic.example/b.png"');
    expect(result.html).not.toContain("blob:");
  });
  it("retries KaTeX font embedding after a failed fetch", async () => {
    vi.resetModules();
    const { embeddedKatexCss } = await import("../src/features/markdown/export/html");
    const fetchFont = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce(new Response(new Uint8Array([3])));
    vi.stubGlobal("fetch", fetchFont);
    await expect(embeddedKatexCss()).rejects.toThrow("KaTeX 字体读取失败");
    await expect(embeddedKatexCss()).resolves.toContain("data:font/woff2;base64,Aw==");
    expect(fetchFont).toHaveBeenCalledTimes(2);
  });
});

describe("WeChat copy", () => {
  it("exposes denied image counts while preserving the remaining clipboard content", async () => {
    vi.spyOn(platform, "readAsset").mockResolvedValue(null);
    const result = await buildWechatHtml(
      article('<p>正文</p><img src="folio-asset://local/private.png" alt="拒绝">'),
      "/docs/a.md",
    );
    expect(result.rejectedImages).toBe(1);
    expect(result.hasLargeImages).toBe(false);
    expect(result.html).toContain("正文");
    expect(result.html).not.toContain("folio-asset:");
    const output = document.createElement("template");
    output.innerHTML = result.html;
    expect(output.content.querySelector("img")?.hasAttribute("src")).toBe(false);
  });

  it("continues to inline clipboard images above the HTML size limit", async () => {
    vi.spyOn(platform, "readAsset").mockResolvedValue(new Uint8Array(21 * 1024 * 1024));
    const result = await buildWechatHtml(
      article('<img src="folio-asset://local/docs/a.png">'),
      "/docs/a.md",
    );
    expect(result.rejectedImages).toBe(0);
    expect(result.hasLargeImages).toBe(true);
    expect(result.html).toContain('src="data:image/png;base64,');
    expect(result.html).not.toContain("folio-asset:");
  });

  it("removes classes, IDs and data attributes while inlining styles", () => {
    const source = article(
      '<p class="x" id="a" data-code="b" style="width:720px;max-width:720px">正文</p><table style="width:540px"><tr><td>表格</td></tr></table>',
    );
    const copy = source.cloneNode(true) as HTMLElement;
    inlineStyles(source, copy);
    expect(copy.outerHTML).not.toMatch(/class=|id=|data-code=/);
    expect(copy.querySelector("p")?.getAttribute("style")).toContain("color:");
    expect(copy.querySelector("p")?.style.width).toBe("");
    expect(copy.querySelector("p")?.style.maxWidth).toBe("");
    expect(copy.querySelector("table")?.style.width).toBe("");
  });
  it("counts formulas that cannot be rasterized and flags images above 2MB", async () => {
    vi.stubGlobal(
      "Image",
      class {
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    vi.spyOn(platform, "readAsset").mockResolvedValue(new Uint8Array(2 * 1024 * 1024 + 1));
    const root = article(
      '<span class="folio-math" data-tex="x^2">x²</span><img src="folio-asset://local/docs/a.png">',
    );
    const result = await buildWechatHtml(root, "/docs/a.md");
    expect(result.degradedMath).toBe(1);
    expect(result.degradedDiagrams).toBe(0);
    expect(result.hasLargeImages).toBe(true);
    expect(result.html).not.toMatch(/class=|data-tex=|<script/i);
    expect(result.html).toContain("x^2");
  });
  it("counts failed diagrams and keeps remote image URLs with responsive sizing", async () => {
    const root = article(
      '<div class="folio-mermaid" data-code="graph LR">图示</div><img src="//picgo.example/a.png" style="width:720px">',
    );
    const result = await buildWechatHtml(root, null);
    expect(result.degradedDiagrams).toBe(1);
    expect(result.degradedMath).toBe(0);
    expect(result.html).toContain('src="https://picgo.example/a.png"');
    expect(result.html).toContain("max-width: 100%");
    expect(result.html).toContain("height: auto");
    expect(result.html).not.toContain("width: 720px");
  });
  it("keeps 2× raster images at their original CSS width", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2]))),
    );
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,AQID",
    );
    const root = article(
      '<span class="folio-math" data-tex="x">x</span><div class="folio-mermaid"><svg xmlns="http://www.w3.org/2000/svg"></svg></div><table><tr><td>表格</td></tr></table>',
    );
    vi.spyOn(root.querySelector(".folio-mermaid")!, "getBoundingClientRect").mockReturnValue({
      width: 300,
      height: 100,
    } as DOMRect);
    vi.spyOn(root.querySelector(".folio-math")!, "getBoundingClientRect").mockReturnValue({
      width: 40,
      height: 20,
    } as DOMRect);
    const result = await buildWechatHtml(root, null);
    expect(result.degradedMath).toBe(0);
    expect(result.degradedDiagrams).toBe(0);
    expect(result.html).toContain("width: 300px");
    expect(result.html).toContain("max-width: 100%");
    expect(result.html).toContain("display: block");
    expect(result.html).toContain("margin: 0px auto");
    expect(result.html).toContain("width: 40px");
    expect(result.html).toContain("vertical-align: middle");
    expect(result.html).toContain("width: 100%");
  });
});
