import { Share2 } from "lucide-react";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../../components/ui";

export function ExportMenu({
  saveAs,
  onExport,
  onCopyPng,
  markdown = false,
  onMarkdownExport,
  exporting = false,
}: {
  saveAs: () => Promise<boolean>;
  onExport: (format: "png" | "svg") => void;
  onCopyPng: () => void;
  markdown?: boolean;
  onMarkdownExport?: (format: "html" | "pdf" | "wechat") => void;
  exporting?: boolean;
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton label="导出" tip="导出">
          <Share2 size={18} />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        {markdown ? (
          <>
            <MenuItem disabled={exporting} onSelect={() => onMarkdownExport?.("pdf")}>
              导出为 PDF…
            </MenuItem>
            <MenuItem disabled={exporting} onSelect={() => onMarkdownExport?.("html")}>
              导出为 HTML…
            </MenuItem>
            <MenuItem disabled={exporting} onSelect={() => onMarkdownExport?.("wechat")}>
              复制到公众号
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => void saveAs()}>另存为 .md…</MenuItem>
          </>
        ) : (
          <>
            <MenuItem onSelect={() => onExport("png")}>
              导出为 PNG… <small>2× · 含可编辑场景</small>
            </MenuItem>
            <MenuItem onSelect={() => onExport("svg")}>
              导出为 SVG… <small>含可编辑场景</small>
            </MenuItem>
            <MenuItem onSelect={onCopyPng} shortcut="⇧⌘C">
              拷贝为 PNG
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => void saveAs()} shortcut="⇧⌘S">
              另存为 .excalidraw…
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
