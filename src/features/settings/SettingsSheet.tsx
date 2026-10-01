import { X } from "lucide-react";
import { Dialog, IconButton, SegmentedControl, Switch } from "../../components/ui";
import { TEXT_SCALES, type TextScale, type ThemeSetting } from "../../lib/settings";
import { useSetting } from "../../lib/useSetting";
import { MarkdownSettings } from "./MarkdownSettings";
import "./settings.css";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeSetting;
  onTheme: (value: ThemeSetting, origin?: { x: number; y: number }) => void;
};

export function SettingsSheet({ open, onOpenChange, theme, onTheme }: Props) {
  const [textScale, setTextScale] = useSetting("textScale");
  const [autosave, setAutosave] = useSetting("autosave");
  const changeScale = (value: TextScale) => {
    setTextScale(value);
    document.documentElement.style.setProperty("--text-scale", String(TEXT_SCALES[value]));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="设置"
      className="folio-settings-sheet"
      headerAction={
        <IconButton
          label="关闭设置"
          className="folio-settings-close"
          onClick={() => onOpenChange(false)}
        >
          <X size={16} />
        </IconButton>
      }
    >
      <section className="settings-group">
        <h3>外观</h3>
        <div className="settings-list">
          <div className="settings-row">
            <span>主题</span>
            <SegmentedControl
              id="settings-theme"
              value={theme}
              onChange={onTheme}
              items={[
                { value: "system", label: "跟随系统" },
                { value: "light", label: "浅色" },
                { value: "dark", label: "深色" },
              ]}
            />
          </div>
          <div className="settings-row settings-row-detail">
            <div className="settings-row-main">
              <span>界面字号</span>
              <SegmentedControl
                id="settings-text-scale"
                label="界面字号"
                value={textScale}
                onChange={changeScale}
                items={(
                  [
                    ["small", "小"],
                    ["standard", "标准"],
                    ["large", "较大"],
                    ["xlarge", "大"],
                  ] as const
                ).map(([value, ariaLabel]) => ({ value, label: "A", ariaLabel }))}
              />
            </div>
            <p className="settings-preview">设计评审 · 2 小时前 · 38 个元素</p>
            <p>只影响界面文字，不影响画布内容。</p>
          </div>
        </div>
      </section>
      <section className="settings-group">
        <h3>编辑</h3>
        <div className="settings-list">
          <div className="settings-row settings-row-detail">
            <div className="settings-row-main">
              <span>自动保存</span>
              <Switch checked={autosave} onCheckedChange={setAutosave} label="自动保存" />
            </div>
            <p>
              编辑可写回的 .excalidraw 文件时，停笔 1.2 秒后自动写回原文件。关闭后请用 ⌘S 手动保存。
            </p>
          </div>
        </div>
      </section>
      <MarkdownSettings />
    </Dialog>
  );
}
