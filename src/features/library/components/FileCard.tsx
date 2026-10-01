import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Ellipsis } from "lucide-react";
import {
  Button,
  Dialog,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../../components/ui";
import { relativeTime } from "../../../lib/format";
import { platform } from "../../../lib/platform";
import {
  generateThumbnail,
  readThumbnailRecord,
  type ThumbnailRecord,
} from "../../../lib/thumbnails";
import type { LibraryItem } from "../types";
import { MissingBadge } from "./MissingBadge";

function useThumbnail(item: LibraryItem, visible: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [record, setRecord] = useState<ThumbnailRecord | null>(null);
  useEffect(() => {
    if (!visible || item.kind === "markdown") return;
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    setRecord(null);
    const load = async () => {
      const data = await readThumbnailRecord(item.id, item.mtime);
      if (data && active) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(data.blob);
        setUrl(objectUrl);
        setRecord(data);
      } else if (!data && item.path && item.section === "folder") {
        generateThumbnail(item.path, item.id, item.mtime);
      }
    };
    const changed = (event: Event) => {
      if ((event as CustomEvent<string>).detail === item.id) void load();
    };
    void load();
    window.addEventListener("folio-thumbnail", changed);
    return () => {
      active = false;
      window.removeEventListener("folio-thumbnail", changed);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.id, item.mtime, item.path, item.section, visible]);
  return { url, record };
}

export function FileCard({
  item,
  index,
  onOpen,
  onRemove,
  pulse = false,
  preview = false,
  previewSkeleton = false,
  previewHover = false,
  previewThumbnail,
  disableThumbLayout = false,
}: {
  item: LibraryItem;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
  pulse?: boolean;
  preview?: boolean;
  previewSkeleton?: boolean;
  previewHover?: boolean;
  previewThumbnail?: string;
  disableThumbLayout?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(preview);
  const [confirm, setConfirm] = useState(false);
  const thumbnail = useThumbnail(item, visible);
  const displayThumbnail =
    thumbnail.url ??
    (preview && !previewSkeleton
      ? (previewThumbnail ??
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Cpath d='M36 130Q84 42 146 118T275 72' fill='none' stroke='%23D97757' stroke-width='5'/%3E%3C/svg%3E")
      : null);
  useEffect(() => {
    if (!root.current || preview) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "240px",
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [preview]);
  const open = () => (item.missing ? menuButton.current?.click() : onOpen());
  return (
    <article
      ref={root}
      className={`library-card ${item.missing ? "is-missing" : ""} ${pulse ? "is-pulsing" : ""} ${previewHover ? "is-hover-preview" : ""}`}
      data-index={index}
      data-id={item.id}
      onContextMenu={(event) => {
        event.preventDefault();
        menuButton.current?.click();
      }}
    >
      <button
        className="library-card-hit"
        type="button"
        aria-label={`${item.name}${item.missing ? "，找不到文件" : ""}`}
        onClick={open}
      />
      <div className="library-thumb">
        {item.kind === "markdown" ? (
          <div className="library-markdown-paper">
            <strong>{item.title ?? item.name}</strong>
            <p>{item.excerpt ?? "Markdown 文稿"}</p>
          </div>
        ) : displayThumbnail ? (
          <div
            className="library-thumb-surface"
            style={{ backgroundColor: thumbnail.record?.bg ?? item.bg }}
          >
            <motion.img
              layoutId={preview || disableThumbLayout ? undefined : `thumb-${item.id}`}
              src={displayThumbnail}
              alt=""
            />
          </div>
        ) : (
          <div className="library-thumb-skeleton" />
        )}
        {item.missing && <MissingBadge />}
        {item.kind !== "excalidraw" && (
          <span className="library-badge">
            {item.kind === "draft"
              ? "草稿"
              : item.kind === "markdown"
                ? "MD"
                : item.kind.toUpperCase()}
          </span>
        )}
        <Menu>
          <MenuTrigger asChild>
            <button
              ref={menuButton}
              className="library-card-more"
              type="button"
              aria-label="更多操作"
            >
              <Ellipsis size={16} />
            </button>
          </MenuTrigger>
          <MenuContent>
            {item.missing ? (
              <MenuItem onSelect={onRemove}>从列表中移除</MenuItem>
            ) : (
              <>
                <MenuItem onSelect={() => onOpen()}>打开</MenuItem>
                {item.path && (
                  <MenuItem onSelect={() => void platform.revealInFinder(item.path!)}>
                    在 Finder 中显示
                  </MenuItem>
                )}
                {item.path && (
                  <MenuItem onSelect={() => void navigator.clipboard?.writeText(item.path!)}>
                    拷贝路径
                  </MenuItem>
                )}
                <MenuSeparator />
                {(item.section === "recent" || item.section === "draft") && (
                  <MenuItem
                    danger={item.section === "draft"}
                    onSelect={() => (item.section === "draft" ? setConfirm(true) : onRemove())}
                  >
                    {item.section === "draft"
                      ? "删除草稿…"
                      : item.missing
                        ? "从列表中移除"
                        : "从「最近」中移除"}
                  </MenuItem>
                )}
              </>
            )}
          </MenuContent>
        </Menu>
      </div>
      <div className="library-card-text">
        <div className="library-card-name" title={item.name}>
          {item.name}
        </div>
        <div className="library-card-meta">
          {relativeTime(item.time)} ·{" "}
          {item.kind === "markdown"
            ? `${item.words ?? 0} 字`
            : `${thumbnail.record?.elementCount ?? item.count} 个元素`}
        </div>
      </div>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`删除草稿“${item.name}”？`}
        description="删除后无法恢复。"
      >
        <Button onClick={() => setConfirm(false)}>取消</Button>
        <Button
          className="library-danger"
          onClick={() => {
            onRemove();
            setConfirm(false);
          }}
        >
          删除草稿
        </Button>
      </Dialog>
    </article>
  );
}
