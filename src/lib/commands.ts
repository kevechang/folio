import type { ThemeSetting } from "./theme";
import { FORMAT_COMMANDS, type FormatCommand } from "../features/markdown/format-commands";

export type CommandId =
  | `format:${FormatCommand}`
  | "new"
  | "newMarkdown"
  | "open"
  | "close"
  | "save"
  | "saveAs"
  | "edit"
  | "read"
  | "restore"
  | "grid"
  | "focus"
  | "exportPng"
  | "exportSvg"
  | "exportHtml"
  | "exportPdf"
  | "copyWechat"
  | "copyPng"
  | "reveal"
  | "quit"
  | "themeSystem"
  | "themeLight"
  | "themeDark"
  | "settings";

export type CommandState = {
  hasDocument: boolean;
  dirty: boolean;
  hasPath: boolean;
  mode: "read" | "edit";
  theme: ThemeSetting;
  autoSave: boolean;
  documentKind?: "canvas" | "markdown";
};

type KeyBinding = { key: string; meta: boolean; shift?: boolean; alt?: boolean };

type CommandDefinition = {
  id: CommandId;
  label: string;
  accelerator?: string;
  key?: KeyBinding;
  enabled: (state: CommandState) => boolean;
  checked?: (state: CommandState) => boolean;
};

export type Command = CommandDefinition & { run: () => void | Promise<void> };

const always = () => true;

const withDocument = (state: CommandState) => state.hasDocument;

const withPath = (state: CommandState) => state.hasDocument && state.hasPath;

const canSave = (state: CommandState) => state.hasDocument && (state.dirty || !state.hasPath);

const baseDefinitions = {
  settings: {
    id: "settings",
    label: "设置…",
    accelerator: "CmdOrCtrl+,",
    key: { key: ",", meta: true },
    enabled: always,
  },
  new: {
    id: "new",
    label: "新建画布",
    accelerator: "CmdOrCtrl+N",
    key: { key: "n", meta: true },
    enabled: always,
  },
  newMarkdown: {
    id: "newMarkdown",
    label: "新建文稿",
    accelerator: "Alt+CmdOrCtrl+N",
    key: { key: "n", meta: true, alt: true },
    enabled: always,
  },
  open: {
    id: "open",
    label: "打开…",
    accelerator: "CmdOrCtrl+O",
    key: { key: "o", meta: true },
    enabled: always,
  },
  close: {
    id: "close",
    label: "关闭文稿",
    accelerator: "CmdOrCtrl+W",
    key: { key: "w", meta: true },
    enabled: withDocument,
  },
  save: {
    id: "save",
    label: "保存",
    accelerator: "CmdOrCtrl+S",
    key: { key: "s", meta: true },
    enabled: canSave,
  },
  saveAs: {
    id: "saveAs",
    label: "另存为…",
    accelerator: "CmdOrCtrl+Shift+S",
    key: { key: "s", meta: true, shift: true },
    enabled: withDocument,
  },
  edit: {
    id: "edit",
    label: "编辑模式",
    accelerator: "CmdOrCtrl+E",
    key: { key: "e", meta: true },
    enabled: withDocument,
    checked: (state) => state.mode === "edit",
  },
  read: {
    id: "read",
    label: "阅读模式",
    enabled: withDocument,
    checked: (state) => state.mode === "read",
  },
  restore: { id: "restore", label: "复原到打开时的版本…", enabled: withPath },
  grid: {
    id: "grid",
    label: "网格",
    accelerator: "CmdOrCtrl+'",
    enabled: (s) => withDocument(s) && s.documentKind !== "markdown",
  },
  focus: {
    id: "focus",
    label: "专注模式",
    accelerator: "Alt+Z",
    enabled: (s) => withDocument(s) && s.documentKind !== "markdown",
  },
  exportPng: {
    id: "exportPng",
    label: "导出为 PNG…",
    enabled: (s) => withDocument(s) && s.documentKind !== "markdown",
  },
  exportSvg: {
    id: "exportSvg",
    label: "导出为 SVG…",
    enabled: (s) => withDocument(s) && s.documentKind !== "markdown",
  },
  exportHtml: {
    id: "exportHtml",
    label: "导出为 HTML…",
    enabled: (s) => withDocument(s) && s.documentKind === "markdown",
  },
  exportPdf: {
    id: "exportPdf",
    label: "导出为 PDF…",
    enabled: (s) => withDocument(s) && s.documentKind === "markdown",
  },
  copyWechat: {
    id: "copyWechat",
    label: "复制到公众号",
    enabled: (s) => withDocument(s) && s.documentKind === "markdown",
  },
  copyPng: {
    id: "copyPng",
    label: "拷贝为 PNG",
    key: { key: "c", meta: true, shift: true },
    enabled: (s) => withDocument(s) && s.documentKind !== "markdown",
  },
  reveal: { id: "reveal", label: "在 Finder 中显示", enabled: withPath },
  quit: { id: "quit", label: "退出 Folio", accelerator: "CmdOrCtrl+Q", enabled: always },
  themeSystem: {
    id: "themeSystem",
    label: "跟随系统",
    enabled: always,
    checked: (state) => state.theme === "system",
  },
  themeLight: {
    id: "themeLight",
    label: "浅色",
    enabled: always,
    checked: (state) => state.theme === "light",
  },
  themeDark: {
    id: "themeDark",
    label: "深色",
    enabled: always,
    checked: (state) => state.theme === "dark",
  },
} satisfies Record<Exclude<CommandId, `format:${FormatCommand}`>, CommandDefinition>;

export const COMMAND_DEFINITIONS: Record<CommandId, CommandDefinition> = {
  ...baseDefinitions,
  ...(Object.fromEntries(
    FORMAT_COMMANDS.map(([name, label, accelerator]) => [
      `format:${name}`,
      {
        id: `format:${name}`,
        label,
        accelerator: accelerator || undefined,
        enabled: (state: CommandState) =>
          state.documentKind === "markdown" && state.mode === "edit",
      },
    ]),
  ) as Record<`format:${FormatCommand}`, CommandDefinition>),
};

export function createCommandRegistry(
  execute: (id: CommandId) => void | Promise<void>,
): Record<CommandId, Command> {
  return Object.fromEntries(
    Object.values(COMMAND_DEFINITIONS).map((definition) => [
      definition.id,
      { ...definition, run: () => execute(definition.id) },
    ]),
  ) as Record<CommandId, Command>;
}

export function createDeduper(windowMs = 150) {
  const last = new Map<string, number>();
  return (id: string, now = Date.now()) => {
    const prev = last.get(id);
    if (prev !== undefined && now - prev < windowMs) return false;
    last.set(id, now);
    return true;
  };
}

export function keyCommand(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "shiftKey" | "altKey">,
): CommandId | null {
  const key = event.key.toLowerCase();
  for (const definition of Object.values(COMMAND_DEFINITIONS)) {
    const binding = definition.key;
    if (!binding) continue;
    if (
      binding.key === key &&
      binding.meta === event.metaKey &&
      Boolean(binding.shift) === event.shiftKey &&
      Boolean(binding.alt) === event.altKey
    )
      return definition.id;
  }
  return null;
}

export function installKeyCommands(run: (id: CommandId) => void) {
  const handler = (event: KeyboardEvent) => {
    const id = keyCommand(event);
    if (!id) return;
    event.preventDefault();
    run(id);
  };
  window.addEventListener("keydown", handler, true);
  return () => window.removeEventListener("keydown", handler, true);
}
