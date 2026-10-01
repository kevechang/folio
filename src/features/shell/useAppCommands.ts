import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { platform } from "../../lib/platform";
import {
  createCommandRegistry,
  createDeduper,
  installKeyCommands,
  type CommandId,
  type CommandState,
} from "../../lib/commands";
import { installNativeMenu, type NativeMenuHandle } from "../../lib/native-menu";
import type { ThemeSetting } from "../../lib/theme";
import type { DocumentActions, DocumentData, DocumentStatus } from "../document/types";

type Options = {
  actions: RefObject<DocumentActions | null>;
  docRef: RefObject<DocumentData | null>;
  statusRef: RefObject<DocumentStatus>;
  settingRef: RefObject<ThemeSetting>;
  newCanvas: () => Promise<void>;
  newMarkdown: () => Promise<void>;
  openDialog: () => Promise<void>;
  changeTheme: (value: ThemeSetting) => void;
  openSettings: () => void;
  settingsOpen: boolean;
  menuSyncRef: RefObject<() => void>;
};

export function useAppCommands({
  actions,
  docRef,
  statusRef,
  settingRef,
  newCanvas,
  newMarkdown,
  openDialog,
  changeTheme,
  openSettings,
  settingsOpen,
  menuSyncRef,
}: Options) {
  const dedupe = useRef(createDeduper());
  const settingsOpenRef = useRef(settingsOpen);
  settingsOpenRef.current = settingsOpen;
  const nativeMenu = useRef<NativeMenuHandle | null>(null);
  const commandState = useCallback(
    (): CommandState => ({
      hasDocument: docRef.current !== null,
      dirty: statusRef.current.dirty,
      hasPath: Boolean(statusRef.current.path ?? docRef.current?.path),
      mode: statusRef.current.mode,
      theme: settingRef.current,
      autoSave: statusRef.current.autoSave,
      documentKind: docRef.current?.kind === "markdown" ? "markdown" : "canvas",
    }),
    [docRef, statusRef, settingRef],
  );
  const syncMenu = useCallback(() => {
    if (nativeMenu.current) void nativeMenu.current.update(commandState());
  }, [commandState]);
  menuSyncRef.current = syncMenu;

  const dispatch = useCallback(
    (id: CommandId) => {
      if (id.startsWith("format:")) {
        actions.current?.formatCommand?.(id.slice(7));
        return;
      }
      switch (id) {
        case "settings":
          openSettings();
          break;
        case "new":
          newCanvas();
          break;
        case "newMarkdown":
          void newMarkdown();
          break;
        case "open":
          void openDialog();
          break;
        case "close":
          void actions.current?.close();
          break;
        case "save":
          void actions.current?.save();
          break;
        case "saveAs":
          void actions.current?.saveAs();
          break;
        case "edit":
          actions.current?.edit();
          break;
        case "read":
          actions.current?.setMode("read");
          break;
        case "grid":
          actions.current?.grid();
          break;
        case "focus":
          actions.current?.focus();
          break;
        case "restore":
          void actions.current?.restore();
          break;
        case "reveal":
          void actions.current?.reveal();
          break;
        case "quit":
          if (actions.current) void actions.current.quit();
          else void platform.exit();
          break;
        case "themeSystem":
          changeTheme("system");
          break;
        case "themeLight":
          changeTheme("light");
          break;
        case "themeDark":
          changeTheme("dark");
          break;
        case "exportPng":
          void actions.current?.exportPng();
          break;
        case "exportSvg":
          void actions.current?.exportSvg();
          break;
        case "exportHtml":
          void actions.current?.exportHtml?.();
          break;
        case "exportPdf":
          void actions.current?.exportPdf?.();
          break;
        case "copyWechat":
          void actions.current?.copyWechat?.();
          break;
        case "copyPng":
          void actions.current?.copyPng();
          break;
      }
    },
    [actions, changeTheme, newCanvas, newMarkdown, openDialog, openSettings],
  );
  const commands = useMemo(() => createCommandRegistry(dispatch), [dispatch]);
  const run = useCallback(
    (id: CommandId) => {
      const command = commands[id];
      if (settingsOpenRef.current && id !== "settings") return;
      if (!command.enabled(commandState()) || !dedupe.current(id)) return;
      void command.run();
    },
    [commandState, commands],
  );

  useEffect(() => installKeyCommands(run), [run]);
  useEffect(() => {
    let active = true;
    let handle: NativeMenuHandle | null = null;
    void installNativeMenu(commands, run, commandState()).then((installed) => {
      if (!active) installed.dispose();
      else {
        handle = installed;
        nativeMenu.current = installed;
        void installed.update(commandState());
      }
    });
    return () => {
      active = false;
      handle?.dispose();
      nativeMenu.current = null;
    };
  }, [commands, run, commandState]);
}
