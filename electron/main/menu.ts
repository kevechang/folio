import { Menu, type BrowserWindow, type MenuItemConstructorOptions } from "electron";

export type MenuNode = {
  id?: string;
  label?: string;
  accelerator?: string;
  enabled?: boolean;
  checked?: boolean;
  type?: "normal" | "checkbox" | "separator";
  role?: MenuItemConstructorOptions["role"];
  submenu?: MenuNode[];
};

export function installMenu(window: BrowserWindow, model: MenuNode[]) {
  const convert = (node: MenuNode): MenuItemConstructorOptions => ({
    id: node.id,
    label: node.label,
    accelerator: node.accelerator,
    enabled: node.enabled,
    checked: node.checked,
    type: node.type,
    role: node.role,
    submenu: node.submenu?.map(convert),
    click: node.id ? () => window.webContents.send("menu-click", node.id) : undefined,
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(model.map(convert)));
}
