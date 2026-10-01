import type { Penna } from "penna-markdown";
import type { EditorView } from "@codemirror/view";

export type ParagraphEdit = { from: number; to: number; insert: "" };

export function paragraphEdits(
  text: string,
  selectionFrom: number,
  selectionTo: number,
): ParagraphEdit[] {
  const edits: ParagraphEdit[] = [];
  let offset = 0;
  const selectionEnd = selectionTo > selectionFrom ? selectionTo - 1 : selectionTo;
  for (const line of text.split("\n")) {
    const end = offset + line.length;
    if (end >= selectionFrom && offset <= selectionEnd) {
      const prefix = /^#{1,6}[ \t]+/.exec(line)?.[0];
      if (prefix) edits.push({ from: offset, to: offset + prefix.length, insert: "" });
    }
    offset = end + 1;
  }
  return edits;
}

export function runParagraphCommand(instance: Penna | null): boolean {
  const view = (
    instance as unknown as { editor?: { getView: () => EditorView } } | null
  )?.editor?.getView();
  if (!view) return false;
  const text = view.state.doc.toString();
  const edits = view.state.selection.ranges.flatMap((range) =>
    paragraphEdits(text, range.from, range.to),
  );
  const unique = Array.from(new Map(edits.map((edit) => [edit.from, edit])).values());
  if (unique.length)
    view.dispatch({ changes: unique.sort((left, right) => left.from - right.from) });
  view.focus();
  return true;
}
