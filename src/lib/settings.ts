export type TextScale = "small" | "standard" | "large" | "xlarge";
export type ThemeSetting = "system" | "light" | "dark";
export type MdReadingWidth = "narrow" | "standard" | "wide";
export type MdEditLayout = "split" | "edit";
export type MdImageStorage = "local" | "picgo" | "upic";

export type Settings = {
  theme: ThemeSetting;
  textScale: TextScale;
  autosave: boolean;
  mdSplitRatio: number;
  mdLineNumbers: boolean;
  mdReadingWidth: MdReadingWidth;
  mdEditLayout: MdEditLayout;
  mdImageStorage: MdImageStorage;
  mdPicgoUrl: string;
  mdUpicPath: string;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  textScale: "large",
  autosave: true,
  mdSplitRatio: 50,
  mdLineNumbers: false,
  mdReadingWidth: "standard",
  mdEditLayout: "split",
  mdImageStorage: "local",
  mdPicgoUrl: "http://127.0.0.1:36677",
  mdUpicPath: "/Applications/uPic.app/Contents/MacOS/uPic",
};

export const MD_READING_WIDTHS: Record<MdReadingWidth, number> = {
  narrow: 640,
  standard: 720,
  wide: 860,
};

export const TEXT_SCALES: Record<TextScale, number> = {
  small: 0.92,
  standard: 1,
  large: 1.12,
  xlarge: 1.25,
};

export function parseSetting<K extends keyof Settings>(key: K, stored: string | null): Settings[K] {
  if (key === "mdEditLayout") {
    if (stored === null && typeof localStorage !== "undefined") {
      const legacy = localStorage.getItem("folio-md-layout");
      if (legacy !== null) {
        stored = legacy;
        localStorage.setItem("folio-mdEditLayout", legacy);
        localStorage.removeItem("folio-md-layout");
      }
    }
    return (stored === "edit" ? "edit" : "split") as Settings[K];
  }
  if (key === "mdImageStorage") {
    return (stored === "picgo" || stored === "upic" ? stored : "local") as Settings[K];
  }
  if (key === "mdPicgoUrl" || key === "mdUpicPath") {
    return (stored?.trim() || DEFAULT_SETTINGS[key]) as Settings[K];
  }
  if (key === "mdSplitRatio") {
    const value = Number(stored);
    return (Number.isFinite(value) && value >= 30 && value <= 70 ? value : 50) as Settings[K];
  }
  if (key === "mdLineNumbers") return (stored === "true") as Settings[K];
  if (key === "mdReadingWidth") {
    return (
      stored === "narrow" || stored === "standard" || stored === "wide"
        ? stored
        : DEFAULT_SETTINGS.mdReadingWidth
    ) as Settings[K];
  }
  if (key === "autosave") {
    return (stored === "true" ? true : stored === "false" ? false : true) as Settings[K];
  }
  if (key === "theme") {
    return (
      stored === "system" || stored === "light" || stored === "dark"
        ? stored
        : DEFAULT_SETTINGS.theme
    ) as Settings[K];
  }
  return (
    stored === "small" || stored === "standard" || stored === "large" || stored === "xlarge"
      ? stored
      : DEFAULT_SETTINGS.textScale
  ) as Settings[K];
}
