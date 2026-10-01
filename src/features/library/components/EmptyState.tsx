import { Button } from "../../../components/ui";

export function EmptyState({
  section,
  query,
  onOpen,
  onNew,
}: {
  section: "recent" | "draft" | "folder";
  query: string;
  onOpen: () => void;
  onNew: () => void;
}) {
  if (query) return <div className="library-search-empty">没有找到“{query}”</div>;
  const title =
    section === "recent"
      ? "还没有打开过文档"
      : section === "draft"
        ? "没有草稿"
        : "这里没有 .excalidraw 或 .md 文件";
  return (
    <div className="library-empty">
      <svg viewBox="0 0 144 120" aria-hidden="true">
        <path className="library-illustration-paper" d="M34 10h56l24 24v74H34z M90 10v24h24" />
        <path className="library-illustration-stroke" d="M49 75c14-23 22 17 35-9 7-14 12 2 19-4" />
      </svg>
      <h2>{title}</h2>
      <p>把 .excalidraw 或 .md 文件拖进窗口，或者</p>
      <div>
        <Button onClick={onOpen}>打开文件…</Button>
        <Button variant="primary" onClick={onNew}>
          新建画布
        </Button>
      </div>
    </div>
  );
}
