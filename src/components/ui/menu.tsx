import type { ReactNode } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";

export const Menu = Dropdown.Root;

export const MenuTrigger = Dropdown.Trigger;

export function MenuContent({
  children,
  theme,
}: {
  children: ReactNode;
  theme?: "light" | "dark";
}) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content align="end" sideOffset={6} className="folio-menu" data-theme={theme}>
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  disabled = false,
  danger = false,
  shortcut,
}: {
  children: ReactNode;
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <Dropdown.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`folio-menu-item ${danger ? "is-danger" : ""}`}
    >
      {children}
      {shortcut && <span className="folio-menu-shortcut">{shortcut}</span>}
    </Dropdown.Item>
  );
}

export const MenuSub = Dropdown.Sub;

export function MenuSubTrigger({ children }: { children: ReactNode }) {
  return (
    <Dropdown.SubTrigger className="folio-menu-item folio-menu-subtrigger">
      {children}
      <ChevronRight size={12} />
    </Dropdown.SubTrigger>
  );
}

export function MenuSubContent({
  children,
  theme,
}: {
  children: ReactNode;
  theme?: "light" | "dark";
}) {
  return (
    <Dropdown.Portal>
      <Dropdown.SubContent sideOffset={6} className="folio-menu" data-theme={theme}>
        {children}
      </Dropdown.SubContent>
    </Dropdown.Portal>
  );
}

export const MenuRadioGroup = Dropdown.RadioGroup;

export function MenuRadioItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Dropdown.RadioItem value={value} className="folio-menu-item folio-menu-radio">
      <span className="folio-radio-indicator">
        <Dropdown.ItemIndicator>✓</Dropdown.ItemIndicator>
      </span>
      {children}
    </Dropdown.RadioItem>
  );
}

export function MenuSeparator() {
  return <Dropdown.Separator className="folio-menu-separator" />;
}
