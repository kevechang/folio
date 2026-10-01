import { useEffect, useState, type RefObject } from "react";

export function MarkdownFind({
  reader,
  html,
}: {
  reader: RefObject<HTMLDivElement | null>;
  html: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.metaKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);
  useEffect(() => {
    const root = reader.current?.querySelector<HTMLElement>(".folio-md");
    if (!root) return;
    for (const mark of root.querySelectorAll("mark.folio-search-hit"))
      mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
    root.normalize();
    if (!open || !query.trim()) {
      setCount(0);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.parentElement?.closest("script,style,svg,.katex,.folio-mermaid")) nodes.push(node);
    }
    let found = 0;
    for (const node of nodes) {
      const value = node.textContent ?? "";
      const fragment = document.createDocumentFragment();
      let offset = 0;
      let next = value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), offset);
      while (next >= 0) {
        fragment.append(document.createTextNode(value.slice(offset, next)));
        const mark = document.createElement("mark");
        mark.className = "folio-search-hit";
        mark.textContent = value.slice(next, next + query.length);
        fragment.append(mark);
        found++;
        offset = next + query.length;
        next = value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), offset);
      }
      if (offset) {
        fragment.append(document.createTextNode(value.slice(offset)));
        node.replaceWith(fragment);
      }
    }
    setCount(found);
    setIndex(0);
  }, [reader, html, open, query]);
  useEffect(() => {
    reader.current
      ?.querySelectorAll("mark.folio-search-hit")
      [index]?.scrollIntoView({ block: "center" });
  }, [reader, index, count]);
  if (!open) return null;
  return (
    <div className="folio-md-find">
      <input
        autoFocus
        aria-label="页内查找"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <span>{count ? `${index + 1}/${count}` : "无结果"}</span>
      <button aria-label="上一个" onClick={() => setIndex((index + count - 1) % (count || 1))}>
        ↑
      </button>
      <button aria-label="下一个" onClick={() => setIndex((index + 1) % (count || 1))}>
        ↓
      </button>
      <button aria-label="关闭查找" onClick={() => setOpen(false)}>
        ×
      </button>
    </div>
  );
}
