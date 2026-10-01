const SCENE_EXTENSION = /(?:\.excalidraw)?\.(?:png|svg)$|\.(?:excalidraw|json|md|markdown)$/i;

export function documentBasename(path: string): string {
  const filename = path.split(/[\\/]/).pop() ?? path;
  return filename.replace(SCENE_EXTENSION, "");
}

export function renameTargetPath(currentPath: string, input: string): string | null {
  const name = input.trim();
  if (!name || /[/:\\]/.test(name)) return null;
  const filename = currentPath.split(/[\\/]/).pop() ?? currentPath;
  const extension = filename.slice(documentBasename(filename).length);
  const separator = Math.max(currentPath.lastIndexOf("/"), currentPath.lastIndexOf("\\"));
  return `${currentPath.slice(0, separator + 1)}${name}${extension}`;
}
