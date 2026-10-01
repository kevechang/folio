import type { ButtonHTMLAttributes, ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import { spring } from "../../lib/motion";
import "./ui.css";

export function Button({
  variant = "secondary",
  small = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  small?: boolean;
}) {
  return (
    <button
      {...props}
      className={`folio-button folio-button--${variant} ${small ? "folio-button--small" : ""} ${props.className ?? ""}`}
    />
  );
}

export function IconButton({
  label,
  tip,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tip?: string; children: ReactNode }) {
  return (
    <Tooltip content={tip ?? label}>
      <button
        {...props}
        type={props.type ?? "button"}
        aria-label={label}
        className={`folio-icon-button ${props.className ?? ""}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
  id,
  label,
}: {
  value: T;
  onChange: (v: T, origin?: { x: number; y: number }) => void;
  items: { value: T; label: string; ariaLabel?: string; icon?: ReactNode }[];
  id: string;
  label?: string;
}) {
  return (
    <div
      className="folio-segmented"
      role="group"
      aria-label={label ?? id}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
        );
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (current < 0) return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
        onChange(items[next].value);
      }}
    >
      {items.map((item) => (
        <button
          type="button"
          aria-label={item.ariaLabel ?? item.label}
          aria-pressed={value === item.value}
          key={item.value}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onChange(item.value, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }}
          className={value === item.value ? "is-selected" : ""}
        >
          {value === item.value && (
            <motion.span
              layoutId={`segment-${id}`}
              layout="position"
              className="folio-segmented-thumb"
              transition={spring.snappy}
            />
          )}
          <span className="folio-segmented-label">
            {item.icon}
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  displayOnly = false,
  pressedPreview = false,
  label = "开关",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  displayOnly?: boolean;
  pressedPreview?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      tabIndex={displayOnly ? -1 : undefined}
      aria-hidden={displayOnly ? true : undefined}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`folio-switch ${checked ? "is-on" : ""} ${displayOnly ? "is-display-only" : ""} ${pressedPreview ? "is-pressed" : ""}`}
    >
      <motion.span
        className="folio-switch-thumb"
        animate={{ x: checked ? 14 : 0 }}
        transition={spring.snappy}
      />
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="folio-kbd">{children}</kbd>;
}

export function Tooltip({
  content,
  shortcut,
  children,
}: {
  content: string;
  shortcut?: string;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content sideOffset={6} className="folio-tooltip">
            {content}
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from "./menu";

export { SearchField, Dialog, Toast, DropOverlay, Capsule } from "./feedback";

export { FolioMark } from "./FolioMark";
