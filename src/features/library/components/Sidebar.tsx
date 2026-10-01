import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Folder,
  FolderPlus,
  Monitor,
  Moon,
  Sun,
  Clock3,
  FilePenLine,
  Ellipsis,
  Settings,
} from "lucide-react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SegmentedControl,
  IconButton,
  Tooltip,
} from "../../../components/ui";
import { platform } from "../../../lib/platform";
import { spring } from "../../../lib/motion";
import type { ThemeSetting } from "../../../lib/theme";

export function Sidebar({
  section,
  folders,
  draftCount,
  theme,
  onSelect,
  onAdd,
  onRemoveFolder,
  onTheme,
  onSettings,
}: {
  section: string;
  folders: string[];
  draftCount: number;
  theme: ThemeSetting;
  onSelect: (section: string) => void;
  onAdd: () => void;
  onRemoveFolder: (folder: string) => void;
  onTheme: (theme: ThemeSetting, origin?: { x: number; y: number }) => void;
  onSettings?: () => void;
}) {
  const row = (id: string, label: string, icon: ReactNode, count?: number) => (
    <button
      className={`library-side-item ${section === id ? "is-selected" : ""}`}
      onClick={() => onSelect(id)}
    >
      {section === id && (
        <motion.span
          layoutId="library-selection"
          className="library-side-selection"
          transition={spring.snappy}
        />
      )}
      <span className="library-side-content">
        {icon}
        <span>{label}</span>
        {count !== undefined && <small>{count}</small>}
      </span>
    </button>
  );
  return (
    <aside className="library-sidebar">
      <div className="library-traffic" data-drag-region />
      <h3>资料库</h3>
      {row("recent", "最近打开", <Clock3 size={16} />)}
      {row("draft", "草稿", <FilePenLine size={16} />, draftCount)}
      <h3>位置</h3>
      {folders.map((folder) => (
        <div
          className="library-folder-row"
          key={folder}
          onContextMenu={(event) => {
            event.preventDefault();
            (event.currentTarget.querySelector("button[data-menu]") as HTMLButtonElement)?.click();
          }}
        >
          <Tooltip content={folder}>
            {row(folder, folder.split(/[\\/]/).pop() ?? folder, <Folder size={16} />)}
          </Tooltip>
          <Menu>
            <Tooltip content="文件夹操作">
              <MenuTrigger asChild>
                <button data-menu className="library-folder-menu" aria-label="文件夹操作">
                  <Ellipsis size={14} />
                </button>
              </MenuTrigger>
            </Tooltip>
            <MenuContent>
              <MenuItem onSelect={() => void platform.revealInFinder(folder)}>
                在 Finder 中显示
              </MenuItem>
              <MenuItem danger onSelect={() => onRemoveFolder(folder)}>
                移除
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      ))}
      <button className="library-side-item library-add" onClick={onAdd}>
        <span className="library-side-content">
          <FolderPlus size={16} />
          添加文件夹…
        </span>
      </button>
      <div className="library-theme">
        <SegmentedControl
          id="library-theme"
          label="外观"
          value={theme}
          onChange={onTheme}
          items={[
            { value: "system", label: "", ariaLabel: "跟随系统", icon: <Monitor size={15} /> },
            { value: "light", label: "", ariaLabel: "浅色", icon: <Sun size={15} /> },
            { value: "dark", label: "", ariaLabel: "深色", icon: <Moon size={15} /> },
          ]}
        />
        <IconButton label="设置" tip="设置 · ⌘," onClick={onSettings}>
          <Settings size={16} />
        </IconButton>
      </div>
    </aside>
  );
}
