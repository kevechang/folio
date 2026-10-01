import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DropOverlay, Toast } from "./components/ui";
import { Gallery } from "./Gallery";
import LibraryView from "./features/library/LibraryView";
import { useAppCommands } from "./features/shell/useAppCommands";
import { useAppTheme } from "./features/shell/useAppTheme";
import { useDocumentManager } from "./features/shell/useDocumentManager";
import { useDocumentTransition } from "./features/shell/useDocumentTransition";
import { useDropHandler } from "./features/shell/useDropHandler";
import { dropCopy } from "./lib/drop";
import { TEXT_SCALES } from "./lib/settings";
import { useSetting } from "./lib/useSetting";
import { SettingsSheet } from "./features/settings/SettingsSheet";
import { spring } from "./lib/motion";
import "./styles/shell.css";

const DocumentShell = lazy(() => import("./features/document/DocumentShell"));
type Notice = {
  id: number;
  text: string;
  kind: "success" | "error";
  action?: { label: string; run: () => void };
};

export default function App() {
  const reducedMotion = useReducedMotion();
  const documentStage = useRef<HTMLDivElement>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const [textScale] = useSetting("textScale");
  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(TEXT_SCALES[textScale]));
  }, [textScale]);
  useEffect(() => {
    if (!settingsOpen) return;
    const blockCanvasKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") return;
      if (event.target instanceof HTMLElement && event.target.closest('[role="dialog"]')) return;
      if (
        event.key.startsWith("Arrow") ||
        event.key === "PageUp" ||
        event.key === "PageDown" ||
        event.key === "Home" ||
        event.key === "End"
      )
        event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", blockCanvasKeys, true);
    return () => window.removeEventListener("keydown", blockCanvasKeys, true);
  }, [settingsOpen]);
  const menuSyncRef = useRef<() => void>(() => {});
  const syncMenu = useCallback(() => menuSyncRef.current(), []);
  const toast = useCallback(
    (
      text: string,
      kind: "success" | "error" = "success",
      action?: { label: string; run: () => void },
    ) => {
      const id = Date.now() + Math.random();
      setNotices((items) => [...items, { id, text, kind, action }]);
      setTimeout(() => setNotices((items) => items.filter((item) => item.id !== id)), 2400);
    },
    [],
  );
  const transition = useDocumentTransition();
  const { setting, theme, settingRef, changeTheme } = useAppTheme(syncMenu);
  const manager = useDocumentManager({ transition, toast, syncMenu });
  const [coveredDocument, setCoveredDocument] = useState(manager.doc);
  useAppCommands({
    actions: manager.actions,
    docRef: manager.docRef,
    statusRef: manager.statusRef,
    settingRef,
    newCanvas: manager.newCanvas,
    newMarkdown: manager.newMarkdown,
    openDialog: manager.openDialog,
    changeTheme,
    openSettings,
    settingsOpen,
    menuSyncRef,
  });
  const dropLabel = useDropHandler({
    actions: manager.actions,
    docRef: manager.docRef,
    statusRef: manager.statusRef,
    openPath: manager.openPath,
    toast,
  });

  if (import.meta.env.DEV && location.search.includes("gallery")) return <Gallery />;

  return (
    <div className="folio-shell">
      {manager.doc ? (
        <Suspense key={manager.doc.id} fallback={null}>
          <motion.div
            key={manager.doc.id}
            ref={documentStage}
            className={`folio-document-stage ${transition.ready ? "is-ready" : ""}`}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.985 }}
            animate={{
              opacity: transition.ready ? 1 : 0,
              scale: reducedMotion ? 1 : transition.ready ? 1 : 0.985,
            }}
            transition={reducedMotion ? { duration: 0.12 } : spring.gentle}
            onAnimationComplete={(definition) => {
              if (!transition.ready || definition === "exit") return;
              const style = documentStage.current?.style;
              style?.removeProperty("transform");
              style?.removeProperty("opacity");
              style?.removeProperty("will-change");
              setCoveredDocument(manager.doc);
              manager.finishDocumentEntry();
            }}
          >
            <DocumentShell
              onOpenPath={manager.openPath}
              onOpenEmbedded={manager.openEmbedded}
              initialEdit={manager.openInEdit}
              returnName={manager.returnEntry?.name}
              initialScroll={manager.restoreScroll.current}
              onReady={transition.handleReady}
              key={manager.doc.id}
              document={manager.doc}
              theme={theme}
              themeSetting={setting}
              onTheme={changeTheme}
              onSettings={openSettings}
              onClose={manager.handleClosed}
              onSaved={manager.handleSaved}
              onMetadata={manager.handleMetadata}
              onRenamed={manager.handleRenamed}
              onCancelPending={manager.clearPending}
              onStatus={manager.handleStatus}
              onToast={toast}
              onMode={manager.handleMode}
              register={(value) => {
                manager.actions.current = value;
              }}
            />
          </motion.div>
        </Suspense>
      ) : null}
      <AnimatePresence initial={false}>
        {!manager.switchingDocument && (!manager.doc || coveredDocument !== manager.doc) && (
          <motion.div
            key="library"
            className={`folio-library-stage ${!manager.doc && coveredDocument ? "is-returning" : ""}`}
            initial={false}
            animate={{ opacity: 1 }}
            style={{ pointerEvents: manager.doc ? "none" : "auto" }}
            exit={{
              opacity: 1,
              pointerEvents: "none",
              transition: { duration: 0 },
            }}
          >
            <LibraryView
              recents={manager.recents}
              section={manager.librarySection}
              onSection={manager.setLibrarySection}
              theme={setting}
              onTheme={changeTheme}
              onSettings={openSettings}
              onOpen={(path, id, hasThumb) => void manager.openPath(path, id, hasThumb)}
              onDraft={(draft, hasThumb) => void manager.openDraft(draft, hasThumb)}
              onOpenDialog={() => void manager.openDialog()}
              onNew={() => void manager.newCanvas()}
              onNewMarkdown={() => void manager.newMarkdown()}
              onRecents={manager.setRecentItems}
              onToast={toast}
              pulseId={transition.pulseId}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {transition.transitionThumb && manager.doc && !reducedMotion && (
        <motion.div
          className="folio-transition-thumb"
          layoutId={`thumb-${transition.transitionThumb.id}`}
          animate={{ opacity: transition.ready ? 0 : 1 }}
          transition={{ duration: 0.22 }}
        >
          <div
            className="folio-transition-thumb-surface"
            style={{ background: transition.transitionThumb.bg }}
          >
            <img src={transition.transitionThumb.src} alt="" />
          </div>
        </motion.div>
      )}
      {dropLabel && (
        <DropOverlay {...dropCopy[dropLabel]} unsupported={dropLabel === "unsupported"} />
      )}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={setting}
        onTheme={changeTheme}
      />
      <div className="folio-toast-host">
        <AnimatePresence>
          {notices.map((notice) => (
            <Toast
              key={notice.id}
              message={notice.text}
              kind={notice.kind}
              action={notice.action}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
