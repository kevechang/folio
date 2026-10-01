import type { Command, CommandId, CommandState } from "./commands";
import { platform } from "./platform";
import { FORMAT_COMMANDS } from "../features/markdown/format-commands";

type Registry = Record<CommandId, Command>;
export type MenuNode = {
  id?: string;
  label?: string;
  accelerator?: string;
  enabled?: boolean;
  checked?: boolean;
  type?: "normal" | "checkbox" | "separator";
  role?:
    | "about"
    | "hide"
    | "hideOthers"
    | "unhide"
    | "cut"
    | "copy"
    | "paste"
    | "minimize"
    | "zoom"
    | "togglefullscreen";
  submenu?: MenuNode[];
};
export type NativeMenuHandle = {
  update: (state: CommandState) => Promise<void>;
  dispose: () => void;
};
const separator = (): MenuNode => ({ type: "separator" });
const role = (value: NonNullable<MenuNode["role"]>): MenuNode => ({ role: value });

export function createMenuModel(commands: Registry, state: CommandState): MenuNode[] {
  const item = (id: CommandId): MenuNode => {
    const command = commands[id];
    return {
      id,
      label: command.label,
      accelerator: command.accelerator,
      enabled: command.enabled(state),
      ...(command.checked ? { type: "checkbox" as const, checked: command.checked(state) } : {}),
    };
  };
  const submenu = (label: string, children: MenuNode[]): MenuNode => ({ label, submenu: children });
  return [
    submenu("Folio", [
      role("about"),
      item("settings"),
      separator(),
      role("hide"),
      role("hideOthers"),
      role("unhide"),
      separator(),
      item("quit"),
    ]),
    submenu("文件", [
      item("new"),
      item("newMarkdown"),
      item("open"),
      separator(),
      item("close"),
      item("save"),
      item("saveAs"),
      item("restore"),
      separator(),
      ...(state.documentKind === "markdown"
        ? [item("exportPdf"), item("exportHtml"), item("copyWechat")]
        : [item("exportPng"), item("exportSvg")]),
      item("reveal"),
    ]),
    submenu("编辑", [role("cut"), role("copy"), role("paste")]),
    ...(state.documentKind === "markdown" && state.mode === "edit"
      ? [
          submenu(
            "格式",
            FORMAT_COMMANDS.map(([command]) => item(`format:${command}`)),
          ),
        ]
      : []),
    submenu("显示", [
      item("read"),
      item("edit"),
      separator(),
      item("grid"),
      item("focus"),
      separator(),
      submenu("外观", [item("themeSystem"), item("themeLight"), item("themeDark")]),
      separator(),
      role("togglefullscreen"),
    ]),
    submenu("窗口", [role("minimize"), role("zoom")]),
  ];
}

export async function installNativeMenu(
  commands: Registry,
  run: (id: CommandId) => void,
  initialState: CommandState,
): Promise<NativeMenuHandle> {
  if (!("folio" in window)) return { update: async () => {}, dispose: () => {} };
  const stop = platform.onMenu((id) => {
    if (id in commands) run(id as CommandId);
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  await window.folio.setMenu(createMenuModel(commands, initialState));
  return {
    async update(state) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void window.folio.setMenu(createMenuModel(commands, state));
      }, 50);
    },
    dispose() {
      clearTimeout(timer);
      void stop.then((unsubscribe) => unsubscribe());
    },
  };
}
