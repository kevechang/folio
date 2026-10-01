import { isAbsolute, extname } from "node:path";
import { fileURLToPath } from "node:url";

export function millimetersToInches(value: number): number {
  return value / 25.4;
}

export function validatePdfPath(targetPath: string): void {
  if (!isAbsolute(targetPath) || extname(targetPath).toLowerCase() !== ".pdf")
    throw new Error("PDF 保存路径无效");
}

export function allowPdfRequest(
  request: { url: string; resourceType: string },
  documentUrl: string,
): boolean {
  try {
    const url = new URL(request.url);
    if (url.protocol === "data:") return true;
    if (url.protocol === "file:") return fileURLToPath(url) === fileURLToPath(new URL(documentUrl));
    return (
      request.resourceType === "image" && (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

export function pdfOptions(): Electron.PrintToPDFOptions {
  const margin = millimetersToInches(18);
  return {
    pageSize: "A4",
    printBackground: true,
    margins: { top: margin, bottom: margin, left: margin, right: margin },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="width:100%;text-align:center;font-size:9pt;color:#8a8880"><span class="pageNumber"></span></div>',
  };
}
