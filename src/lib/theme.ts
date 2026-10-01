import { parseSetting, type ThemeSetting } from "./settings";
export type { ThemeSetting } from "./settings";

export function readTheme(): ThemeSetting {
  try {
    return parseSetting("theme", localStorage.getItem("folio-theme"));
  } catch {
    return "system";
  }
}

export function resolveTheme(setting: ThemeSetting): "light" | "dark" {
  return setting === "system"
    ? matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : setting;
}

export function applyTheme(setting: ThemeSetting, actual = resolveTheme(setting)) {
  try {
    localStorage.setItem("folio-theme", setting);
  } catch {}
  document.documentElement.dataset.theme = actual;
  return actual;
}
