import { useState } from "react";
import { useSetting } from "./lib/useSetting";
import type { TextScale } from "./lib/settings";
import {
  Button,
  FolioMark,
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
  SegmentedControl,
} from "./components/ui";

export function GalleryScaleControl() {
  const [textScale, setTextScale] = useSetting("textScale");
  return (
    <SegmentedControl
      id="gallery-text-scale"
      label="界面字号"
      value={textScale}
      onChange={(value: TextScale) => setTextScale(value)}
      items={[
        { value: "small", label: "小" },
        { value: "standard", label: "标准" },
        { value: "large", label: "较大" },
        { value: "xlarge", label: "大" },
      ]}
    />
  );
}

export type GalleryTheme = "light" | "dark";

export function DialogPreview({ kind }: { kind: "unsaved" | "conflict" }) {
  const unsaved = kind === "unsaved";
  return (
    <div className="folio-dialog folio-dialog-preview">
      <div className="folio-dialog-icon">
        <FolioMark size={48} />
      </div>
      <h3>{unsaved ? "要保存对“设计评审”的更改吗？" : "“设计评审”已在别处被修改"}</h3>
      <p>{unsaved ? "如果不保存，你的更改将会丢失。" : "磁盘上的版本比你打开时更新。"}</p>
      <div className="folio-dialog-actions">
        <Button variant="ghost">{unsaved ? "不保存" : "另存为…"}</Button>
        <Button>{unsaved ? "取消" : "载入磁盘版本"}</Button>
        <Button variant="primary">{unsaved ? "保存" : "用我的版本覆盖"}</Button>
      </div>
    </div>
  );
}

export function GalleryMenu({ theme }: { theme: GalleryTheme }) {
  const [selection, setSelection] = useState("system");
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button>打开菜单</Button>
      </MenuTrigger>
      <MenuContent theme={theme}>
        <MenuItem shortcut="⌘S">带快捷键</MenuItem>
        <MenuItem disabled>禁用菜单项</MenuItem>
        <MenuItem danger>危险操作</MenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>外观</MenuSubTrigger>
          <MenuSubContent theme={theme}>
            <MenuRadioGroup value={selection} onValueChange={setSelection}>
              <MenuRadioItem value="system">跟随系统</MenuRadioItem>
              <MenuRadioItem value="light">浅色</MenuRadioItem>
              <MenuRadioItem value="dark">深色</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}
