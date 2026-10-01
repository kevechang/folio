export function resolveRelativePath(documentPath: string, target: string) {
  const parts = documentPath.replace(/\\/g, "/").split("/");
  parts.pop();
  for (const part of target.replace(/\\/g, "/").split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}
