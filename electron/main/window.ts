import { app, BrowserWindow, shell } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { backgroundColor } from "./theme";

type WindowState = { x?: number; y?: number; width: number; height: number };
const statePath = () => join(app.getPath("userData"), "window-state.json");

export async function createWindow() {
  let state: WindowState = { width: 1280, height: 820 };
  try {
    state = { ...state, ...JSON.parse(await readFile(statePath(), "utf8")) };
  } catch {
    // First launch has no saved state.
  }
  const window = new BrowserWindow({
    ...state,
    minWidth: 880,
    minHeight: 600,
    center: state.x === undefined,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 20 },
    transparent: false,
    backgroundColor: backgroundColor(),
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  window.webContents.session.webRequest.onBeforeRequest(
    {
      urls: [
        "https://math-api-delta.vercel.app/*",
        "https://mermaid.ink/*",
        "https://echarts-api.vercel.app/*",
      ],
    },
    (_details, callback) => callback({ cancel: true }),
  );
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const saveState = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (window.isDestroyed()) return;
      const bounds = window.getNormalBounds();
      void writeFile(statePath(), JSON.stringify(bounds)).catch(() => {});
    }, 200);
  };
  window.on("resize", saveState);
  window.on("move", saveState);
  window.on("ready-to-show", () => window.show());
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:)/i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  return window;
}
