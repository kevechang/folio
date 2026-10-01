import { useState, type RefObject } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Link,
  Image,
  Table,
  Sigma,
  Shapes,
} from "lucide-react";
import type { Penna } from "penna-markdown";
import { runParagraphCommand } from "./format-paragraph";

export function FormatCapsule({
  instance,
  onCanvas,
}: {
  instance: RefObject<Penna | null>;
  onCanvas: (create: boolean) => void;
}) {
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);
  const groups = [
    [
      ["bold", "加粗 ⌘B", Bold],
      ["italic", "斜体 ⌘I", Italic],
      ["strikethrough", "删除线 ⇧⌘X", Strikethrough],
      ["code", "行内代码 ⇧⌘`", Code],
    ],
    [
      ["unorderedList", "无序列表", List],
      ["orderedList", "有序列表", ListOrdered],
      ["taskList", "任务列表", ListTodo],
      ["blockquote", "引用", Quote],
    ],
    [
      ["link", "链接 ⌘K", Link],
      ["image", "图片", Image],
      ["table", "表格", Table],
      ["mathBlock", "公式", Sigma],
    ],
  ] as const;
  return (
    <div className="folio-format-capsule" role="toolbar" aria-label="文稿格式">
      <div className="folio-format-heading">
        <button title="标题" aria-label="标题" onClick={() => setHeadingOpen(!headingOpen)}>
          H ▾
        </button>
        {headingOpen && (
          <div className="folio-format-popup">
            {[
              ["paragraph", "正文 ⌘0"],
              ["heading1", "标题 1 ⌘1"],
              ["heading2", "标题 2 ⌘2"],
              ["heading3", "标题 3 ⌘3"],
            ].map(([command, label]) => (
              <button
                key={command}
                onClick={() => {
                  if (command === "paragraph") runParagraphCommand(instance.current);
                  else instance.current?.runCommand(command);
                  setHeadingOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {groups.map((group, index) => (
        <div className="folio-format-group" key={index}>
          {group.map(([command, title, Icon]) => (
            <button
              key={command}
              title={title}
              aria-label={title}
              onClick={() => instance.current?.runCommand(command)}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      ))}
      <div className="folio-format-heading">
        <button title="插入画布" aria-label="插入画布" onClick={() => setCanvasOpen(!canvasOpen)}>
          <Shapes size={16} />
        </button>
        {canvasOpen && (
          <div className="folio-format-popup">
            <button
              onClick={() => {
                onCanvas(false);
                setCanvasOpen(false);
              }}
            >
              选择已有画布…
            </button>
            <button
              onClick={() => {
                onCanvas(true);
                setCanvasOpen(false);
              }}
            >
              新建空白画布
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
