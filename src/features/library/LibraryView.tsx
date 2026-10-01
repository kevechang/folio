import { useEffect, useRef, useState } from "react";
import type { Draft, Recent } from "../../lib/persistence";
import type { ThemeSetting } from "../../lib/theme";
import { EmptyState } from "./components/EmptyState";
import { FileGrid } from "./components/FileGrid";
import { LibraryHeader } from "./components/LibraryHeader";
import { Sidebar } from "./components/Sidebar";
import { useLibraryData } from "./useLibraryData";
import { filterByKind } from "./model";
import "./library.css";

type Props = {
  recents: Recent[];
  section: string;
  onSection: (section: string) => void;
  theme: ThemeSetting;
  onTheme: (value: ThemeSetting, origin?: { x: number; y: number }) => void;
  onSettings?: () => void;
  onOpen: (path: string, id?: string, hasThumb?: boolean) => void;
  onDraft: (draft: Draft, hasThumb: boolean) => void;
  onOpenDialog: () => void;
  onNew: () => void;
  onNewMarkdown?: () => void;
  onRecents: (items: Recent[]) => void;
  onToast: (message: string) => void;
  pulseId: string | null;
};

export default function LibraryView({
  recents,
  section,
  onSection,
  theme,
  onTheme,
  onSettings,
  onOpen,
  onDraft,
  onOpenDialog,
  onNew,
  onNewMarkdown,
  onRecents,
  onToast,
  pulseId,
}: Props) {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const [kindFilters, setKindFilters] = useState<Record<string, "all" | "canvas" | "markdown">>(
    () => {
      try {
        return JSON.parse(localStorage.getItem("folio-library-filters") ?? "{}");
      } catch {
        return {};
      }
    },
  );
  useEffect(() => {
    try {
      localStorage.setItem("folio-library-filters", JSON.stringify(kindFilters));
    } catch {
      /* Storage unavailable. */
    }
  }, [kindFilters]);
  const kindFilter = kindFilters[section] ?? "all";
  const { folders, drafts, items, contentReady, addFolder, removeFolder, removeItem } =
    useLibraryData({
      recents,
      section,
      onSection,
      onRecents,
      query,
    });
  const visibleItems = filterByKind(items, kindFilter);
  return (
    <div className="folio-library">
      <Sidebar
        section={section}
        folders={folders}
        draftCount={drafts.length}
        theme={theme}
        onSelect={(value) => {
          setQuery("");
          onSection(value);
        }}
        onAdd={() => void addFolder()}
        onRemoveFolder={removeFolder}
        onTheme={onTheme}
        onSettings={onSettings}
      />
      <div className="library-main">
        <LibraryHeader
          title={
            section === "recent"
              ? "最近打开"
              : section === "draft"
                ? "草稿"
                : (section.split(/[\\/]/).pop() ?? section)
          }
          count={visibleItems.length}
          path={section === "recent" || section === "draft" ? undefined : section}
          query={query}
          onQuery={setQuery}
          onOpen={onOpenDialog}
          onNew={onNew}
          onNewMarkdown={onNewMarkdown}
          kindFilter={kindFilter}
          onKindFilter={(value) => {
            if (value === kindFilter) return;
            if (scroll.current && scroll.current.scrollTop > 0) {
              const stage = scroll.current.querySelector<HTMLElement>(".library-grid-stage");
              if (stage) {
                stage.style.minHeight = `${Math.max(
                  stage.offsetHeight,
                  scroll.current.scrollTop + scroll.current.clientHeight,
                )}px`;
              }
              scroll.current.scrollTo({
                top: 0,
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              });
            }
            setKindFilters((current) => ({ ...current, [section]: value }));
          }}
          scrolled={scrolled}
        />
        <div
          ref={scroll}
          className="library-scroll"
          onScroll={(event) => {
            const top = event.currentTarget.scrollTop;
            setScrolled(top > 4);
            if (top === 0) {
              const stage = event.currentTarget.querySelector<HTMLElement>(".library-grid-stage");
              if (stage) stage.style.minHeight = "";
            }
          }}
        >
          {contentReady && (
            <FileGrid
              items={visibleItems}
              filterKey={`${section}:${kindFilter}`}
              pulseId={pulseId}
              emptyState={
                <EmptyState
                  section={
                    section === "recent" ? "recent" : section === "draft" ? "draft" : "folder"
                  }
                  query={query}
                  onOpen={onOpenDialog}
                  onNew={onNew}
                />
              }
              onRemove={(item) => {
                void removeItem(item).then(() => {
                  if (item.section === "draft") onToast("已删除草稿");
                });
              }}
              onOpen={(item, hasThumb) => {
                if (item.section === "draft") {
                  const draft = drafts.find((value) => value.id === item.id);
                  if (draft) onDraft(draft, hasThumb);
                } else if (item.path) onOpen(item.path, item.id, hasThumb);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
