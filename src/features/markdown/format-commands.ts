export const FORMAT_COMMANDS = [
  ["paragraph", "正文", "CmdOrCtrl+0"],
  ["heading1", "标题 1", "CmdOrCtrl+1"],
  ["heading2", "标题 2", "CmdOrCtrl+2"],
  ["heading3", "标题 3", "CmdOrCtrl+3"],
  ["bold", "加粗", "CmdOrCtrl+B"],
  ["italic", "斜体", "CmdOrCtrl+I"],
  ["strikethrough", "删除线", "CmdOrCtrl+Shift+X"],
  ["code", "行内代码", "Shift+CmdOrCtrl+`"],
  ["link", "链接", "CmdOrCtrl+K"],
  ["unorderedList", "无序列表", ""],
  ["orderedList", "有序列表", ""],
  ["taskList", "任务列表", ""],
  ["blockquote", "引用", ""],
  ["table", "表格", ""],
  ["mathBlock", "公式", ""],
  ["insertCanvas", "插入画布", ""],
] as const;

export type FormatCommand = (typeof FORMAT_COMMANDS)[number][0];

export function shortcutConflicts(defaults: Readonly<Record<string, string>>): string[] {
  const normalize = (shortcut: string) =>
    shortcut.toLowerCase().replace("cmdorctrl", "mod").split(/[+-]/).sort().join("+");
  return FORMAT_COMMANDS.filter(
    ([command, , shortcut]) =>
      shortcut && defaults[command] && normalize(shortcut) !== normalize(defaults[command]),
  ).map(([command]) => command);
}
