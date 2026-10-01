import { useEffect, useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { Search, Check, AlertCircle, FileDown } from "lucide-react";
import { FolioMark } from "./FolioMark";
import { spring } from "../../lib/motion";

export function SearchField({
  value,
  onChange,
  placeholder = "搜索画布",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <motion.label className="folio-search" layout transition={spring.snappy}>
      <Search size={16} />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
      />
    </motion.label>
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  headerAction,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}) {
  const restoreFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="folio-dialog-overlay" />
        <DialogPrimitive.Content
          className={`folio-dialog ${className ?? ""}`}
          onOpenAutoFocus={() => {
            restoreFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            if (!restoreFocus.current?.isConnected) return;
            event.preventDefault();
            restoreFocus.current.focus();
          }}
        >
          {!headerAction && (
            <div className="folio-dialog-icon">
              <FolioMark size={48} />
            </div>
          )}
          <div className={headerAction ? "folio-dialog-heading" : undefined}>
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            {headerAction}
          </div>
          {description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}
          <div className={headerAction ? "folio-dialog-body" : "folio-dialog-actions"}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Toast({
  message,
  kind = "success",
  action,
}: {
  message: string;
  kind?: "success" | "error";
  action?: { label: string; run: () => void };
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={reduced ? { duration: 0.12 } : spring.smooth}
      className="folio-toast"
      role="status"
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      {kind === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
      <span>{message}</span>
      {action && (
        <button type="button" className="folio-toast-action" onClick={action.run}>
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

export function DropOverlay({
  label = "松手打开",
  description = "支持 Excalidraw 画布",
  unsupported = false,
}: {
  label?: string;
  description?: string;
  unsupported?: boolean;
}) {
  return (
    <div className={`folio-drop ${unsupported ? "is-unsupported" : ""}`}>
      <svg className="folio-drop-dash" preserveAspectRatio="none">
        <rect
          x="2"
          y="2"
          width="99%"
          height="99%"
          rx="28"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="8 8"
        />
      </svg>
      <div className="folio-drop-content">
        <div className="folio-drop-icon">
          <FileDown size={28} />
        </div>
        <h2>{label}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Capsule({ children }: { children: ReactNode }) {
  return <span className="folio-capsule">{children}</span>;
}
