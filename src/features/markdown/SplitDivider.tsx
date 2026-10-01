import { useState } from "react";

export function SplitDivider({
  ratio,
  onRatio,
}: {
  ratio: number;
  onRatio: (value: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const clamp = (value: number) => Math.max(30, Math.min(70, value));
  return (
    <div
      className={`folio-md-divider ${dragging ? "is-dragging" : ""}`}
      role="separator"
      tabIndex={0}
      aria-label="调整源码和预览的宽度"
      aria-orientation="vertical"
      aria-valuemin={30}
      aria-valuemax={70}
      aria-valuenow={ratio}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const parent = event.currentTarget.parentElement;
        if (parent)
          onRatio(
            clamp(
              ((event.clientX - parent.getBoundingClientRect().left) / parent.clientWidth) * 100,
            ),
          );
      }}
      onPointerUp={() => setDragging(false)}
      onLostPointerCapture={() => setDragging(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          onRatio(clamp(ratio + (event.key === "ArrowRight" ? 2 : -2)));
        }
      }}
    >
      <i />
    </div>
  );
}
