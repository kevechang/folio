export type LibraryItem = {
  id: string;
  path: string | null;
  name: string;
  kind: "excalidraw" | "png" | "svg" | "draft" | "markdown";
  time: number;
  count: number;
  bg: string;
  mtime: number;
  missing?: boolean;
  section: "recent" | "draft" | "folder";
  title?: string;
  excerpt?: string;
  words?: number;
};
