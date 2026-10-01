import { app, BrowserWindow, session } from "electron";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { allowPdfRequest, pdfOptions, validatePdfPath } from "./pdf-options";

export async function exportPdf(html: string, targetPath: string): Promise<void> {
  validatePdfPath(targetPath);
  const directory = join(app.getPath("temp"), "folio-export");
  await mkdir(directory, { recursive: true });
  const temporary = join(directory, `${randomUUID()}.html`);
  const documentUrl = pathToFileURL(temporary).href;
  const pdfSession = session.fromPartition("folio-pdf");
  pdfSession.webRequest.onBeforeRequest((details, callback) =>
    callback({ cancel: !allowPdfRequest(details, documentUrl) }),
  );
  let window: BrowserWindow | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    await writeFile(temporary, html, "utf8");
    window = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        javascript: false,
        contextIsolation: true,
        nodeIntegration: false,
        partition: "folio-pdf",
      },
    });
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    const contents = window.webContents;
    const work = async () => {
      await window!.loadFile(temporary);
      const bytes = await contents.printToPDF(pdfOptions());
      if (contents.isDestroyed()) throw new Error("PDF 导出已取消");
      await writeFile(targetPath, bytes);
    };
    await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("PDF 导出超时")), 60_000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    if (window && !window.isDestroyed()) window.destroy();
    await rm(temporary, { force: true });
    pdfSession.webRequest.onBeforeRequest(null);
  }
}
