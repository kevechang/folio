import { nativeTheme, type BrowserWindow } from "electron";

export function currentTheme(): "light" | "dark" {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

export function backgroundColor() {
  return currentTheme() === "dark" ? "#262624" : "#FAF9F5";
}

export function installTheme(window: BrowserWindow) {
  const update = () => {
    window.setBackgroundColor(backgroundColor());
    if (nativeTheme.themeSource === "system")
      window.webContents.send("system-theme-changed", currentTheme());
  };
  nativeTheme.on("updated", update);
  window.on("closed", () => nativeTheme.off("updated", update));
  return (theme: "light" | "dark" | null) => {
    nativeTheme.themeSource = theme ?? "system";
    window.setBackgroundColor(backgroundColor());
  };
}
