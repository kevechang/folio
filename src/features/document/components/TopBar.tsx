import { BookOpen, ChevronLeft, Columns2, FileCode, ListTree, Pencil } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Button, IconButton, SegmentedControl } from "../../../components/ui";
import type { ThemeSetting } from "../../../lib/theme";
import type { ExportFormat } from "../../../lib/exporting";
import type { DocumentMode } from "../types";
import type { DocumentPersistence } from "../useDocumentPersistence";
import { TitlePopover } from "./TitlePopover";
import { ExportMenu } from "./ExportMenu";
import { MoreMenu } from "./MoreMenu";
import { ReadingProgress } from "../../markdown/ReadingProgress";

export function TopBar({
  api,
  mode,
  setMode,
  persistence,
  autoSave,
  setAutoSave,
  themeSetting,
  onTheme,
  onSettings,
  onExport,
  onCopyPng,
  markdown = false,
  onMarkdownExport,
  exporting = false,
  returnName,
  metadata,
  outline,
  onOutline,
  layout,
  onLayout,
  progress,
  progressVisible,
}: {
  api: React.RefObject<ExcalidrawImperativeAPI | null>;
  mode: DocumentMode;
  setMode: (mode: DocumentMode) => void;
  persistence: DocumentPersistence;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  themeSetting: ThemeSetting;
  onTheme: (value: ThemeSetting, origin?: { x: number; y: number }) => void;
  onSettings: () => void;
  onExport: (format: ExportFormat) => void;
  onCopyPng: () => void;
  markdown?: boolean;
  onMarkdownExport?: (format: "html" | "pdf" | "wechat") => void;
  exporting?: boolean;
  returnName?: string;
  metadata?: { words: number; minutes: number } | null;
  outline?: boolean;
  onOutline?: () => void;
  layout?: "split" | "edit";
  onLayout?: () => void;
  progress?: number;
  progressVisible?: boolean;
}) {
  return (
    <header className="folio-document-bar" data-drag-region>
      <div className="folio-document-left">
        <IconButton
          label={returnName ? `返回“${returnName}”` : "返回资料库"}
          tip={returnName ? `返回“${returnName}” · ⌘W` : "返回资料库 · ⌘W"}
          onClick={() => void persistence.close()}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <TitlePopover
          persistence={persistence}
          subtitle={
            markdown && mode === "read" && metadata
              ? `${metadata.words} 字 · 约 ${metadata.minutes} 分钟`
              : undefined
          }
        />
      </div>
      <SegmentedControl
        id="document-mode"
        label="文稿模式"
        value={mode}
        onChange={setMode}
        items={[
          { value: "read", label: "阅读", icon: <BookOpen size={14} /> },
          { value: "edit", label: "编辑", icon: <Pencil size={14} /> },
        ]}
      />
      <div className="folio-document-right">
        {markdown && mode === "edit" && (
          <IconButton label="切换布局" onClick={onLayout}>
            {layout === "split" ? <Columns2 size={18} /> : <FileCode size={18} />}
          </IconButton>
        )}
        {markdown && (
          <IconButton label="目录" aria-pressed={outline} onClick={onOutline}>
            <ListTree size={18} />
          </IconButton>
        )}
        {markdown && (
          <Button small onClick={() => void persistence.save()}>
            保存
          </Button>
        )}
        {persistence.kind !== "excalidraw" && persistence.kind !== "markdown" && (
          <Button variant="primary" small onClick={() => void persistence.saveAs()}>
            保存…
          </Button>
        )}
        <ExportMenu
          saveAs={persistence.saveAs}
          onExport={onExport}
          onCopyPng={onCopyPng}
          markdown={markdown}
          onMarkdownExport={onMarkdownExport}
          exporting={exporting}
        />
        <MoreMenu
          api={api}
          markdown={markdown}
          path={persistence.path}
          autoSave={autoSave}
          setAutoSave={setAutoSave}
          themeSetting={themeSetting}
          onTheme={onTheme}
          onSettings={onSettings}
        />
      </div>
      {markdown && <ReadingProgress value={progress ?? 0} visible={progressVisible ?? false} />}
    </header>
  );
}
