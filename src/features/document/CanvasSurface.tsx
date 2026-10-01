import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Excalidraw, Footer, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, LibraryItems } from "@excalidraw/excalidraw/types";
import type { ExcalidrawFrameLikeElement } from "@excalidraw/excalidraw/element/types";
import { FolioMark } from "../../components/ui";
import { platform } from "../../lib/platform";
import { safeGet, safeSet } from "../../lib/persistence";
import { clampFramePage, orderFrames } from "../../lib/frames";
import { shouldCheckScene, type SceneCheck } from "./scene-change";
import { FramePager } from "./components/FramePager";
import type { DocumentData, DocumentMode, LatestScene } from "./types";
import type { DocumentPersistence } from "./useDocumentPersistence";
import { UI_OPTIONS } from "./document-config";

export function CanvasSurface({
  doc,
  theme,
  mode,
  api,
  persistence,
  onReady,
}: {
  doc: DocumentData;
  theme: "light" | "dark";
  mode: DocumentMode;
  api: React.RefObject<ExcalidrawImperativeAPI | null>;
  persistence: DocumentPersistence;
  onReady: () => void;
}) {
  const [frames, setFrames] = useState<ExcalidrawFrameLikeElement[]>([]);
  const [page, setPage] = useState(0);
  const sceneCheck = useRef<SceneCheck | null>(null);
  const libraryItems = useMemo(() => safeGet<LibraryItems>("library", []), [doc.id]);
  const initialData = useMemo(
    () => (doc.initial ? { ...doc.initial, libraryItems } : { libraryItems }),
    [doc.id, libraryItems],
  );
  const handleLibraryChange = useCallback((items: LibraryItems) => safeSet("library", items), []);
  const handleLinkOpen: NonNullable<ComponentProps<typeof Excalidraw>["onLinkOpen"]> = useCallback(
    (element, event) => {
      const link = element.link;
      if (link && /^(https?:|mailto:)/i.test(link)) {
        event.preventDefault();
        void platform.openExternal(link);
      }
    },
    [],
  );
  const onChange = useCallback(
    (
      elements: LatestScene["elements"],
      appState: LatestScene["appState"],
      files: LatestScene["files"],
    ) => {
      const check = {
        elements,
        files,
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      };
      if (!shouldCheckScene(sceneCheck.current, check)) return;
      sceneCheck.current = check;
      persistence.onChangeModel({ elements, appState, files });
    },
    [persistence.onChangeModel],
  );
  const goToPage = useCallback(
    (next: number) => {
      const index = clampFramePage(next, frames.length);
      const frame = frames[index];
      if (!frame || (index === page && next === page)) return;
      setPage(index);
      api.current?.scrollToContent(frame, {
        fitToViewport: true,
        viewportZoomFactor: 0.9,
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: 520,
      });
    },
    [frames, page, api],
  );
  useEffect(() => {
    if (mode !== "read") return;
    const ordered = orderFrames(api.current?.getSceneElements() ?? []);
    setFrames(ordered);
    setPage((value) => clampFramePage(value, ordered.length));
  }, [mode, doc.id, persistence.dirty, api]);
  useEffect(() => {
    const timer = setTimeout(() => {
      api.current?.history.clear();
      if (mode === "read") setFrames(orderFrames(api.current?.getSceneElements() ?? []));
      if (mode === "read")
        api.current?.scrollToContent(undefined, {
          fitToViewport: true,
          viewportZoomFactor: 0.9,
          maxZoom: 1,
        });
      requestAnimationFrame(onReady);
    }, 100);
    return () => clearTimeout(timer);
  }, [doc.id, onReady]);
  useEffect(() => {
    if (mode === "read")
      api.current?.scrollToContent(undefined, {
        fitToViewport: true,
        viewportZoomFactor: 0.9,
        maxZoom: 1,
      });
  }, [mode]);
  return (
    <div className="folio-canvas">
      <Excalidraw
        excalidrawAPI={(value) => {
          api.current = value;
        }}
        initialData={initialData}
        onChange={onChange}
        onLibraryChange={handleLibraryChange}
        viewModeEnabled={mode === "read"}
        theme={theme}
        langCode="zh-CN"
        aiEnabled={false}
        UIOptions={UI_OPTIONS}
        onLinkOpen={handleLinkOpen}
      >
        <MainMenu>
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.Help />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <FolioMark size={48} />
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>从一笔开始</WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>
        {mode === "read" && frames.length > 0 && (
          <Footer>
            <FramePager frames={frames} page={page} onPage={goToPage} />
          </Footer>
        )}
      </Excalidraw>
    </div>
  );
}
