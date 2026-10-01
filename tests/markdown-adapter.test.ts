import { describe, expect, it } from "vitest";
import { markdownAdapter, markdownMetadata } from "../src/lib/markdown";

describe("markdown adapter", () => {
  it("loads, serializes and fingerprints text", async () => {
    const text = "# 你好 Folio\n";
    expect(await markdownAdapter.load(markdownAdapter.serialize(text), null)).toBe(text);
    expect(markdownAdapter.fingerprint(text)).toBe(markdownAdapter.fingerprint(text));
    expect(markdownAdapter.fingerprint(text)).not.toBe(markdownAdapter.fingerprint(text + "!"));
    expect(markdownAdapter.fingerprint("😀")).not.toBe(markdownAdapter.fingerprint("😃"));
    expect(markdownAdapter.empty()).toBe("");
  });
  it("counts mixed Chinese and English and extracts metadata", () => {
    expect(markdownMetadata("# 标题\n\n你好 hello world", "fallback")).toMatchObject({
      title: "标题",
      words: 6,
    });
    expect(markdownMetadata("正文", "fallback").title).toBe("fallback");
  });
});
