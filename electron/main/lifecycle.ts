import { app, type BrowserWindow } from "electron";

export function installLifecycle(window: BrowserWindow) {
  let allowed = false;
  const ask = () => {
    if (!window.isDestroyed()) window.webContents.send("close-requested");
  };
  window.on("close", (event) => {
    if (allowed) return;
    event.preventDefault();
    ask();
  });
  app.on("before-quit", (event) => {
    if (allowed) return;
    event.preventDefault();
    ask();
  });
  return {
    request: ask,
    complete() {
      allowed = true;
      app.quit();
    },
  };
}
