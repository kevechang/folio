import { FileCard } from "./features/library/components/FileCard";
import { LibraryHeader } from "./features/library/components/LibraryHeader";
import type { LibraryItem } from "./features/library/types";
import type { GalleryTheme } from "./GalleryParts";

const wideThumbnail = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120"><rect x="12" y="12" width="456" height="96" rx="12" fill="none" stroke="#D97757" stroke-width="5"/><path d="M50 76H430" stroke="#D97757" stroke-width="5"/></svg>')}`;
const tallThumbnail = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 300"><rect x="12" y="12" width="96" height="276" rx="12" fill="none" stroke="#D97757" stroke-width="5"/><path d="M40 60V240" stroke="#D97757" stroke-width="5"/></svg>')}`;

export function GalleryCards({ theme }: { theme: GalleryTheme }) {
  const sample: LibraryItem = {
    id: "gallery-normal",
    path: "/Design.excalidraw",
    name: "设计评审",
    kind: "excalidraw",
    time: Date.now() - 7200000,
    count: 38,
    bg: "#FAF9F5",
    mtime: 1,
    section: "recent",
  };
  return (
    <>
      <h3>资料库卡片</h3>
      <LibraryHeader
        title="最近打开"
        count={4}
        query=""
        onQuery={() => {}}
        onOpen={() => {}}
        onNew={() => {}}
        onNewMarkdown={() => {}}
        kindFilter="all"
        onKindFilter={() => {}}
        scrolled={false}
      />
      <div className="gallery-library-cards">
        <FileCard
          item={{
            ...sample,
            id: "gallery-md",
            kind: "markdown",
            title: "Folio 文稿",
            excerpt: "纸页上的文字会跟随主题和字号变化。这里是阅读与编辑共用的资料库卡片。",
            words: 1284,
          }}
          index={0}
          preview
          onOpen={() => {}}
          onRemove={() => {}}
        />
        <FileCard item={sample} index={0} preview onOpen={() => {}} onRemove={() => {}} />
        <FileCard
          item={{ ...sample, id: "gallery-hover" }}
          index={1}
          preview
          previewHover
          onOpen={() => {}}
          onRemove={() => {}}
        />
        <FileCard
          item={{ ...sample, id: "gallery-draft", kind: "draft", section: "draft", path: null }}
          index={2}
          preview
          onOpen={() => {}}
          onRemove={() => {}}
        />
        <FileCard
          item={{ ...sample, id: "gallery-png", kind: "png" }}
          index={3}
          preview
          onOpen={() => {}}
          onRemove={() => {}}
        />
        <FileCard
          item={{ ...sample, id: "gallery-missing", missing: true }}
          index={4}
          preview
          onOpen={() => {}}
          onRemove={() => {}}
        />
        <FileCard
          item={{ ...sample, id: "gallery-skeleton" }}
          index={5}
          preview
          previewSkeleton
          onOpen={() => {}}
          onRemove={() => {}}
        />
        {theme === "dark" && (
          <>
            <FileCard
              item={{ ...sample, id: "gallery-wide", name: "宽图", bg: "#ffffff" }}
              index={6}
              preview
              previewThumbnail={wideThumbnail}
              onOpen={() => {}}
              onRemove={() => {}}
            />
            <FileCard
              item={{ ...sample, id: "gallery-tall", name: "高图", bg: "#ffffff" }}
              index={7}
              preview
              previewThumbnail={tallThumbnail}
              onOpen={() => {}}
              onRemove={() => {}}
            />
          </>
        )}
      </div>
    </>
  );
}

export function GalleryStatus() {
  return (
    <>
      <h3>标题状态</h3>
      <div className="gallery-status-list">
        {[
          "已保存",
          "正在保存…",
          "已编辑",
          "草稿 · 未存储到文件",
          "来自 PNG · 另存后可保存",
          "外部已修改",
        ].map((status) => (
          <button className="folio-title-button" key={status}>
            <span>设计评审</span>
            <small>{status}</small>
          </button>
        ))}
      </div>
    </>
  );
}
