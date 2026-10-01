import { Ellipsis } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Switch,
} from "../../../components/ui";
import type { ThemeSetting } from "../../../lib/theme";
import { platform } from "../../../lib/platform";

export function MoreMenu({
  api,
  path,
  autoSave,
  setAutoSave,
  themeSetting,
  onTheme,
  onSettings,
  markdown = false,
}: {
  api: React.RefObject<ExcalidrawImperativeAPI | null>;
  path: string | null;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  themeSetting: ThemeSetting;
  onTheme: (value: ThemeSetting, origin?: { x: number; y: number }) => void;
  onSettings: () => void;
  markdown?: boolean;
}) {
  function toggleGrid() {
    if (api.current)
      api.current.updateScene({
        appState: { gridModeEnabled: !api.current.getAppState().gridModeEnabled },
      });
  }

  function toggleFocus() {
    if (api.current)
      api.current.updateScene({
        appState: { zenModeEnabled: !api.current.getAppState().zenModeEnabled },
      });
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton label="更多" tip="更多">
          <Ellipsis size={18} />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          onSelect={(event) => {
            event.preventDefault();
            setAutoSave(!autoSave);
          }}
        >
          自动保存{" "}
          <Switch checked={autoSave} onCheckedChange={() => {}} displayOnly label="自动保存" />
        </MenuItem>
        {!markdown && (
          <MenuItem onSelect={toggleGrid} shortcut="⌘'">
            网格
          </MenuItem>
        )}
        {!markdown && (
          <MenuItem onSelect={toggleFocus} shortcut="⌥Z">
            专注模式
          </MenuItem>
        )}
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>外观</MenuSubTrigger>
          <MenuSubContent>
            <MenuRadioGroup
              value={themeSetting}
              onValueChange={(value) => onTheme(value as ThemeSetting)}
            >
              <MenuRadioItem value="system">跟随系统</MenuRadioItem>
              <MenuRadioItem value="light">浅色</MenuRadioItem>
              <MenuRadioItem value="dark">深色</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        {!markdown && (
          <MenuItem
            onSelect={() =>
              api.current?.updateScene({ appState: { openDialog: { name: "help" } } })
            }
            shortcut="?"
          >
            键盘快捷键
          </MenuItem>
        )}
        <MenuItem
          disabled={!path}
          onSelect={() => {
            if (path) void platform.revealInFinder(path);
          }}
        >
          在 Finder 中显示
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={onSettings} shortcut="⌘,">
          设置…
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
