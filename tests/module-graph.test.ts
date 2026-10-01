import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(
    (entry: { name: string; isDirectory(): boolean }) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    },
  );
}

function hasTopLevelAwait(node: ts.Node): boolean {
  if (ts.isFunctionLike(node)) return false;
  if (ts.isAwaitExpression(node)) return true;
  if (ts.isForOfStatement(node) && node.awaitModifier) return true;
  return ts.forEachChild(node, hasTopLevelAwait) ?? false;
}

describe("module graph", () => {
  it("has no top-level await in source modules", () => {
    const violations = sourceFiles("src").filter((path) => {
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      return source.statements.some(hasTopLevelAwait);
    });
    expect(violations.map((path) => relative("src", path))).toEqual([]);
  });

  it("has no Tauri imports or globals", () => {
    const violations = sourceFiles("src").filter((path) =>
      new RegExp(["@tauri", "apps"].join("-") + "|" + ["__", "TAURI"].join("")).test(
        readFileSync(path, "utf8"),
      ),
    );
    expect(violations).toEqual([]);
  });

  it.each(["electron.ts", "web.ts"])("%s does not import the platform barrel", (name) => {
    const path = join("src/lib/platform", name);
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const imports = source.statements
      .filter(ts.isImportDeclaration)
      .map((statement) => statement.moduleSpecifier)
      .filter(ts.isStringLiteral)
      .map((specifier) => specifier.text);
    expect(imports).not.toContain("./index");
  });
});
