import { app } from "electron";
import { commandLinePaths, createOpenFiles } from "./open-files";
import { installProtocol } from "./protocol";
import { createWindow } from "./window";
import { installLifecycle } from "./lifecycle";
import { installIpc } from "./ipc";

let window: Awaited<ReturnType<typeof createWindow>> | null = null;
const openFiles = createOpenFiles(
  (paths) => window?.webContents.send("open-files", paths),
  () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  },
);
app.on("open-file", (event, path) => {
  event.preventDefault();
  openFiles.receive([path]);
});
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", (_event, args) => openFiles.secondInstance(args));
  openFiles.receive(commandLinePaths(process.argv.slice(1)));
  app.whenReady().then(async () => {
    installProtocol();
    window = await createWindow();
    installIpc(window, openFiles, installLifecycle(window));
    if (process.env.ELECTRON_RENDERER_URL) await window.loadURL(process.env.ELECTRON_RENDERER_URL);
    else await window.loadURL("app://folio/");
  });
}
