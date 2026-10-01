import { motion, useReducedMotion } from "motion/react";

export type OutlineHeading = { level: number; label: string; index: number };
export function OutlinePanel({
  headings,
  active,
  onSelect,
}: {
  headings: OutlineHeading[];
  active: number;
  onSelect: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <nav className="folio-md-outline" aria-label="目录">
      {headings.map((heading) => (
        <button
          key={heading.index}
          className={heading.index === active ? "is-active" : ""}
          style={{ paddingLeft: 12 + (heading.level - 1) * 12 }}
          onClick={() => onSelect(heading.index)}
        >
          {heading.index === active && (
            <motion.i
              layoutId="folio-md-outline-active"
              className="folio-md-outline-indicator"
              transition={
                reduced ? { duration: 0.12 } : { type: "spring", stiffness: 420, damping: 34 }
              }
            />
          )}
          {heading.label}
        </button>
      ))}
    </nav>
  );
}
