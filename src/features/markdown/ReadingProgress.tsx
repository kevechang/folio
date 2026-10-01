export function ReadingProgress({ value, visible }: { value: number; visible: boolean }) {
  return (
    <div
      className={`folio-md-progress ${visible ? "is-visible" : ""}`}
      style={{ width: `${value * 100}%` }}
    />
  );
}
