import { describe, expect, it } from "vitest";
import {
  allowPdfRequest,
  millimetersToInches,
  pdfOptions,
  validatePdfPath,
} from "../../electron/main/pdf-options";

describe("PDF export rules", () => {
  it("uses A4, 18mm margins and a page-number footer", () => {
    const options = pdfOptions();
    expect(options.pageSize).toBe("A4");
    expect(options.printBackground).toBe(true);
    expect(options.margins).toEqual({
      top: millimetersToInches(18),
      bottom: millimetersToInches(18),
      left: millimetersToInches(18),
      right: millimetersToInches(18),
    });
    expect(options.footerTemplate).toContain('class="pageNumber"');
  });
  it("rejects relative paths and other extensions", () => {
    expect(() => validatePdfPath("report.pdf")).toThrow();
    expect(() => validatePdfPath("/tmp/report.html")).toThrow();
    expect(() => validatePdfPath("/tmp/report.pdf")).not.toThrow();
  });
  it("allows normalized temporary file URLs, data URLs and remote images only", () => {
    const target = "file:///tmp/folio-export/a.html";
    expect(allowPdfRequest({ url: target, resourceType: "mainFrame" }, target)).toBe(true);
    expect(
      allowPdfRequest({ url: "data:image/png;base64,abc", resourceType: "image" }, target),
    ).toBe(true);
    expect(
      allowPdfRequest(
        { url: "file:///tmp/folio-export/b.html", resourceType: "mainFrame" },
        target,
      ),
    ).toBe(false);
    expect(
      allowPdfRequest({ url: "https://example.com/image.png", resourceType: "image" }, target),
    ).toBe(true);
    expect(
      allowPdfRequest({ url: "http://example.com/image.png", resourceType: "image" }, target),
    ).toBe(true);
    for (const resourceType of ["script", "stylesheet", "font", "xhr", "subFrame"])
      expect(allowPdfRequest({ url: "https://example.com/resource", resourceType }, target)).toBe(
        false,
      );
    const chinese = "file:///tmp/folio-export/%E4%B8%AD%E6%96%87%20%E6%96%87%E7%A8%BF.html";
    expect(
      allowPdfRequest(
        { url: "file:///tmp/folio-export/中文 文稿.html", resourceType: "mainFrame" },
        chinese,
      ),
    ).toBe(true);
  });
});
