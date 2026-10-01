import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ChevronDown, Plus, Search } from "lucide-react";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SegmentedControl,
} from "../../../components/ui";
import { middleEllipsis } from "../../../lib/format";
import { platform } from "../../../lib/platform";
import { spring } from "../../../lib/motion";

export function LibraryHeader({
  title,
  count,
  path,
  query,
  onQuery,
  onOpen,
  onNew,
  onNewMarkdown,
  kindFilter,
  onKindFilter,
  scrolled,
}: {
  title: string;
  count: number;
  path?: string;
  query: string;
  onQuery: (value: string) => void;
  onOpen: () => void;
  onNew: () => void;
  onNewMarkdown?: () => void;
  kindFilter?: "all" | "canvas" | "markdown";
  onKindFilter?: (value: "all" | "canvas" | "markdown") => void;
  scrolled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <header className={`library-header ${scrolled ? "is-scrolled" : ""}`} data-drag-region>
      <div className="library-heading">
        <div>
          <h1>{title}</h1>
          <small>{count} 个文档</small>
        </div>
        {path && (
          <p title={path}>
            {middleEllipsis(path, 60)}{" "}
            <button onClick={() => void platform.revealInFinder(path)}>在 Finder 中显示</button>
          </p>
        )}
      </div>
      {kindFilter && onKindFilter && (
        <SegmentedControl
          id="library-kind"
          label="文档筛选"
          value={kindFilter}
          onChange={onKindFilter}
          items={[
            { value: "all", label: "全部" },
            { value: "canvas", label: "画布" },
            { value: "markdown", label: "文稿" },
          ]}
        />
      )}
      <div className="library-header-actions">
        <motion.label layout transition={spring.snappy} className="library-search">
          <Search size={16} />
          <input
            ref={input}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onQuery("");
                event.currentTarget.blur();
              }
            }}
            placeholder="搜索文档"
          />
        </motion.label>
        <Button onClick={onOpen}>打开…</Button>
        <div className="library-new-split">
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} />
            新建画布
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="primary" aria-label="新建其他文档">
                <ChevronDown size={12} />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={onNew} shortcut="⌘N">
                新建画布
              </MenuItem>
              <MenuItem onSelect={onNewMarkdown} shortcut="⌥⌘N">
                新建文稿
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </header>
  );
}
