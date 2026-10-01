import { useState } from "react";
import { GalleryMarkdownStates } from "./GalleryMarkdownStates";
import { GalleryCards, GalleryStatus } from "./GalleryCards";
import { DialogPreview, GalleryMenu, GalleryScaleControl, type GalleryTheme } from "./GalleryParts";
import { EmptyState } from "./features/library/components/EmptyState";
import { Sidebar } from "./features/library/components/Sidebar";
import { BookOpen, Pencil, Settings } from "lucide-react";
import "./features/markdown/theme/folio.css";
import {
  Button,
  Capsule,
  Dialog,
  DropOverlay,
  FolioMark,
  IconButton,
  Kbd,
  SearchField,
  SegmentedControl,
  Switch,
  Toast,
  Tooltip,
} from "./components/ui";

function GalleryColumn({ theme }: { theme: GalleryTheme }) {
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [switchOn, setSwitchOn] = useState(false);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"unsaved" | "conflict" | null>(null);
  const dropLabels = [
    ["松手打开", "支持 Excalidraw 画布"],
    ["松手插入图片", "把图片放入画布"],
    ["松手导入到素材库", "支持 .excalidrawlib"],
    ["不支持这种文件", "请选择可打开的画布"],
  ] as const;

  return (
    <section data-theme={theme}>
      <h2>{theme === "light" ? "浅色" : "深色"}</h2>
      <FolioMark size={64} />
      <div className="gallery-row">
        <Button variant="primary">主要按钮</Button>
        <Button>次级按钮</Button>
        <Button variant="ghost">幽灵按钮</Button>
        <Button disabled>禁用按钮</Button>
      </div>
      <div className="gallery-row">
        <IconButton label="设置" tip="设置">
          <Settings size={16} />
        </IconButton>
        <IconButton label="禁用设置" disabled>
          <Settings size={16} />
        </IconButton>
        <Tooltip content="提示文字" shortcut="⌘S">
          <Button>悬停提示</Button>
        </Tooltip>
        <Kbd>⌘⇧S</Kbd>
      </div>
      <div className="gallery-row">
        <SegmentedControl
          id={`gallery-${theme}`}
          value={mode}
          onChange={setMode}
          items={[
            { value: "read", label: "阅读", icon: <BookOpen size={14} /> },
            { value: "edit", label: "编辑", icon: <Pencil size={14} /> },
          ]}
        />
        <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
        <Switch checked={true} onCheckedChange={() => {}} pressedPreview />
        <Switch checked={false} onCheckedChange={() => {}} disabled />
      </div>
      <div className="gallery-row">
        <SearchField value={query} onChange={setQuery} />
        <Capsule>胶囊标签</Capsule>
      </div>
      <div className="gallery-row">
        <GalleryMenu theme={theme} />
        <Button onClick={() => setDialog("unsaved")}>未保存对话框</Button>
        <Button onClick={() => setDialog("conflict")}>冲突对话框</Button>
      </div>
      <div className="gallery-row">
        <Toast message="已保存" />
        <Toast message="保存失败" kind="error" />
        <Toast
          message="已导出 设计评审.png"
          action={{ label: "在 Finder 中显示", run: () => {} }}
        />
      </div>
      <GalleryStatus />
      <h3>对话框</h3>
      <DialogPreview kind="unsaved" />
      <DialogPreview kind="conflict" />
      <GalleryCards theme={theme} />
      <h3>阅读排版与目录</h3>
      <GalleryMarkdownStates />
      <div
        className="folio-md-body"
        style={{ minHeight: 340, display: "flex", position: "relative" }}
      >
        <nav className="folio-md-outline" aria-label="目录样张">
          <button className="is-active">引言</button>
          <button style={{ paddingLeft: 24 }}>设计原则</button>
          <button style={{ paddingLeft: 36 }}>材质</button>
        </nav>
        <div className="penna-theme-default" style={{ margin: "0 auto" }}>
          <div className="penna">
            <div className="penna-body">
              <div className="penna-preview">
                <article
                  className="penna-render folio-md"
                  style={{ width: 500, margin: "0 auto", padding: "32px" }}
                >
                  <h1>在纸上阅读</h1>
                  <p>
                    Folio 把 <strong>画布</strong> 与 <em>文稿</em>{" "}
                    放在同一处。阅读区用温暖的纸张材质，让内容成为主角。
                  </p>
                  <blockquote>一段安静的引用。</blockquote>
                  <pre>
                    <code>const folio = "reader";</code>
                  </pre>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3>侧栏与空状态</h3>
      <div className="gallery-sidebar">
        <Sidebar
          section="recent"
          folders={["/Design"]}
          draftCount={3}
          theme="system"
          onSelect={() => {}}
          onAdd={() => {}}
          onRemoveFolder={() => {}}
          onTheme={() => {}}
        />
      </div>
      {["recent", "draft", "folder"].map((section) => (
        <div className="gallery-empty" key={section}>
          <EmptyState
            section={section as "recent" | "draft" | "folder"}
            query=""
            onOpen={() => {}}
            onNew={() => {}}
          />
        </div>
      ))}
      <h3>拖放遮罩</h3>
      <div className="gallery-drop-grid">
        {dropLabels.map(([label, description], index) => (
          <div className="gallery-drop-preview" key={label}>
            <DropOverlay label={label} description={description} unsupported={index === 3} />
          </div>
        ))}
      </div>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog === "unsaved" ? "要保存对“设计评审”的更改吗？" : "“设计评审”已在别处被修改"}
        description={
          dialog === "unsaved" ? "如果不保存，你的更改将会丢失。" : "磁盘上的版本比你打开时更新。"
        }
      >
        <Button variant="ghost" onClick={() => setDialog(null)}>
          {dialog === "unsaved" ? "不保存" : "另存为…"}
        </Button>
        <Button onClick={() => setDialog(null)}>
          {dialog === "unsaved" ? "取消" : "载入磁盘版本"}
        </Button>
        <Button variant="primary" onClick={() => setDialog(null)}>
          {dialog === "unsaved" ? "保存" : "用我的版本覆盖"}
        </Button>
      </Dialog>
    </section>
  );
}

export function Gallery() {
  return (
    <div className="folio-gallery">
      <h1>Folio · 组件画廊</h1>
      <GalleryScaleControl />
      <div className="folio-gallery-columns">
        <GalleryColumn theme="light" />
        <GalleryColumn theme="dark" />
      </div>
    </div>
  );
}
