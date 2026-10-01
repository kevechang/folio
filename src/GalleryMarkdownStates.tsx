import "./features/markdown/theme/folio.css";

export function GalleryMarkdownStates() {
  const states = ["正常", "悬停", "丢失", "失败", "骨架"];
  return (
    <div className="folio-md-body" style={{ padding: 20 }}>
      <h3>画布嵌入状态</h3>
      <div className="penna-theme-default">
        <div className="penna">
          <div className="penna-body">
            <div className="penna-preview">
              <div
                className="penna-render folio-md"
                style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}
              >
                {states.map((state) => (
                  <div key={state}>
                    <small>{state}</small>
                    {state === "骨架" ? (
                      <div className="folio-embed folio-skeleton" />
                    ) : state === "失败" || state === "丢失" ? (
                      <div className="folio-embed folio-render-error">
                        {state === "丢失" ? "找不到画布“arch.excalidraw”" : "无法读取这张画布"}
                        <button className="folio-embed-repair">选择文件…</button>
                      </div>
                    ) : (
                      <figure
                        className={`folio-embed folio-ready ${state === "悬停" ? "gallery-embed-hover" : ""}`}
                      >
                        <div
                          className="folio-embed-art"
                          style={{
                            aspectRatio: "16 / 9",
                            background: "var(--manilla)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          画布预览
                        </div>
                        <button className="folio-embed-open">在 Folio 中打开</button>
                        <figcaption>系统架构</figcaption>
                      </figure>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3>格式胶囊与查找条</h3>
      <div
        className="folio-format-capsule"
        style={{ position: "relative", left: 0, transform: "none", width: "max-content" }}
      >
        <button>H ▾</button>
        <div className="folio-format-group">
          <button>B</button>
          <button>I</button>
          <button>‹›</button>
        </div>
        <div className="folio-format-group">
          <button>☑</button>
          <button>∑</button>
          <button>画布</button>
        </div>
      </div>
      <div
        className="folio-md-find"
        style={{
          position: "relative",
          left: 0,
          transform: "none",
          width: "max-content",
          marginTop: 16,
        }}
      >
        <input aria-label="页内查找样张" placeholder="查找文稿…" />
        <span>2/5</span>
        <button>↑</button>
        <button>↓</button>
        <button>×</button>
      </div>
    </div>
  );
}
