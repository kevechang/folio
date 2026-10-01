import "./asset-path";
import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/motion.css";
import "@excalidraw/excalidraw/index.css";
import "./styles/excalidraw-skin.css";
import App from "./App";
import { Button } from "./components/ui";

class ErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state = { error: null } as { error: Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "100%",
            display: "grid",
            placeItems: "center",
            padding: 32,
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        >
          <div style={{ maxWidth: 520, width: "100%" }}>
            <h1 style={{ font: "600 var(--fs-title) var(--font-display)", margin: "0 0 16px" }}>
              出了点问题
            </h1>
            <pre
              style={{
                font: "var(--fs-footnote)/1.6 var(--font-mono)",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                color: "var(--ink-2)",
                margin: "0 0 24px",
              }}
            >
              {this.state.error.message}
            </pre>
            <Button onClick={() => location.reload()}>重新载入</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <div className="folio-app">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </div>
    </MotionConfig>
  </React.StrictMode>,
);
