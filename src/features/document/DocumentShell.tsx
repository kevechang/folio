import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Penna } from "penna-markdown";
import type { DocumentAdapter } from "../../lib/markdown";
import { markdownAdapter, renderMarkdown } from "../../lib/markdown";
import { canvasAdapter, type CanvasModel } from "../../lib/canvas-adapter";
import { storeSceneThumbnail } from "../../lib/thumbnails";
import { hashPath } from "../../lib/persistence";
import { useSetting } from "../../lib/useSetting";
import { markdownMetadata } from "../../lib/markdown";
import { TopBar } from "./components/TopBar";
import { DocumentDialogs } from "./components/DocumentDialogs";
import { CanvasActions } from "./CanvasActions";
import { MarkdownActions } from "./MarkdownActions";
import { useDocumentPersistence } from "./useDocumentPersistence";
import type { LatestScene } from "./types";
import { useDocumentMode } from "./useDocumentMode";
import { useCanvasExports } from "./useCanvasExports";
import { useMarkdownExports } from "../markdown/export/useMarkdownExports";
import type { DocumentViewProps } from "./document-config";
import "./document.css";
import "penna-markdown/editor.css";
import "../markdown/theme/folio.css";

const CanvasSurface = lazy(() =>
  import("./CanvasSurface").then((module) => ({ default: module.CanvasSurface })),
);
const MarkdownSurface = lazy(() =>
  import("../markdown/MarkdownSurface").then((module) => ({ default: module.MarkdownSurface })),
);

export default function DocumentShell(props: DocumentViewProps) {
  const {
    document: doc,
    onClose,
    onSaved,
    onMetadata,
    onRenamed,
    onToast,
    onCancelPending,
    onStatus,
    onMode,
    onReady,
    register,
    theme,
    themeSetting,
    onTheme,
    onSettings,
    onOpenPath,
    onOpenEmbedded,
    initialEdit,
    returnName,
    initialScroll,
  } = props;
  const markdown = doc.kind === "markdown";
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const penna = useRef<Penna | null>(null);
  const [text, setText] = useState(doc.text ?? "");
  const [html, setHtml] = useState("");
  const { mode, leaving, setDocumentMode } = useDocumentMode(
    initialEdit || !doc.path ? "edit" : "read",
    markdown,
  );
  const [outline, setOutline] = useState(() => window.innerWidth >= 1100);
  const [layout, setLayout] = useSetting("mdEditLayout");
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [autoSave, setAutoSave] = useSetting("autosave");
  useEffect(() => {
    const notify = (event: Event) => onToast((event as CustomEvent<string>).detail, "error");
    window.addEventListener("folio:upload-error", notify);
    return () => window.removeEventListener("folio:upload-error", notify);
  }, [onToast]);
  const adapter = (markdown ? markdownAdapter : canvasAdapter) as DocumentAdapter<unknown>;
  const initial = markdown ? (doc.text ?? adapter.empty()) : (doc.initial ?? adapter.empty());
  const apply = useCallback(
    (value: unknown) => {
      if (markdown) {
        const next = value as string;
        setText(next);
        penna.current?.setMarkdown(next);
        return;
      }
      const scene = value as CanvasModel | null;
      if (!scene || !api.current) return;
      api.current.updateScene({
        elements: scene.elements,
        appState: scene.appState,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      api.current.addFiles(Object.values(scene.files));
      api.current.history.clear();
    },
    [markdown],
  );
  const persistence = useDocumentPersistence(adapter, {
    doc,
    initial,
    mode,
    autoSave,
    apply,
    onClose,
    onSaved,
    onMetadata,
    onRenamed,
    onToast,
    onCancelPending,
    savedFields: (value) => (markdown ? { text: value as string } : {}),
    draftFields: (value) => {
      if (markdown) return { text: value as string };
      const scene = value as CanvasModel;
      storeSceneThumbnail(doc.id, scene as LatestScene, Date.now());
      return {
        elementCount: scene.elements.filter((element) => !element.isDeleted).length,
        bg: scene.appState.viewBackgroundColor,
      };
    },
    afterSave: (value, path, mtime) => {
      if (markdown) return;
      const scene = value as CanvasModel;
      onMetadata(
        path,
        scene.elements.filter((element) => !element.isDeleted).length,
        scene.appState.viewBackgroundColor,
        mtime,
      );
      setTimeout(() => storeSceneThumbnail(hashPath(path), scene as LatestScene, mtime), 2000);
    },
  });
  useEffect(() => {
    if (!markdown) return;
    let cancelled = false;
    void renderMarkdown(text, persistence.path).then((value) => {
      if (!cancelled) setHtml(value);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown, text, persistence.path]);
  const onTextChange = useCallback(
    (value: string) => {
      setText(value);
      persistence.onChangeModel(value);
    },
    [persistence.onChangeModel],
  );
  useEffect(() => {
    onMode(mode);
    onStatus({ dirty: persistence.dirty, path: persistence.path, autoSave, mode });
  }, [mode, autoSave, persistence.dirty, persistence.path, onMode, onStatus]);
  useEffect(() => {
    if (markdown) requestAnimationFrame(onReady);
  }, [markdown, onReady]);
  const { runExport, copyPng } = useCanvasExports(api, persistence.name, onToast);
  const { run: runMarkdownExport, exporting } = useMarkdownExports(
    text,
    persistence.path,
    persistence.name,
    onToast,
  );
  const meta = markdown ? markdownMetadata(text, persistence.name) : null;
  return (
    <div
      className={`folio-document ${markdown ? "folio-markdown-document" : ""} ${mode === "read" ? "is-reading" : "is-editing"} ${leaving ? "is-leaving-edit" : ""}`}
    >
      <TopBar
        api={api}
        mode={mode}
        setMode={setDocumentMode}
        persistence={persistence}
        autoSave={autoSave}
        setAutoSave={setAutoSave}
        themeSetting={themeSetting}
        onTheme={onTheme}
        onSettings={onSettings}
        onExport={runExport}
        onCopyPng={copyPng}
        markdown={markdown}
        onMarkdownExport={(format) => void runMarkdownExport(format)}
        exporting={exporting}
        returnName={!markdown ? returnName : undefined}
        metadata={meta}
        outline={outline}
        onOutline={() => setOutline(!outline)}
        layout={layout}
        onLayout={() => {
          const next = layout === "split" ? "edit" : "split";
          setLayout(next);
        }}
        progress={progress}
        progressVisible={progressVisible}
      />
      <Suspense fallback={null}>
        {markdown ? (
          <MarkdownSurface
            text={text}
            html={html}
            mode={mode}
            path={persistence.path}
            onChange={onTextChange}
            onOpenPath={onOpenPath}
            onOpenEmbedded={onOpenEmbedded}
            onEdit={() => setDocumentMode("edit")}
            initialScroll={initialScroll}
            onRequestSave={async () => {
              onToast("请先保存文稿");
              return (await persistence.saveAs()) ? persistence.getPath() : null;
            }}
            onToast={onToast}
            editorInstance={penna}
            outline={outline}
            progress={progress}
            layout={layout}
            progressVisible={progressVisible}
            onProgress={(value) => {
              setProgressVisible(value >= 0);
              if (value >= 0) setProgress(value);
            }}
          />
        ) : (
          <CanvasSurface
            doc={doc}
            theme={theme}
            mode={mode}
            api={api}
            persistence={persistence}
            onReady={onReady}
          />
        )}
      </Suspense>
      {markdown ? (
        <MarkdownActions
          persistence={persistence}
          mode={mode}
          setMode={setDocumentMode}
          register={register}
          instance={penna}
          onToast={onToast}
          onMarkdownExport={runMarkdownExport}
        />
      ) : (
        <CanvasActions
          api={api}
          persistence={persistence}
          edit={() => setDocumentMode(mode === "read" ? "edit" : "read")}
          setDocumentMode={setDocumentMode}
          runExport={runExport}
          copyPng={copyPng}
          register={register}
        />
      )}
      <DocumentDialogs persistence={persistence} />
    </div>
  );
}
