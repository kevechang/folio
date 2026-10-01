import { describe, expect, it } from "vitest";
import { paragraphEdits } from "../src/features/markdown/format-paragraph";

function applyEdits(text: string, from: number, to: number): string {
  const edits = paragraphEdits(text, from, to);
  return edits.reduceRight(
    (result, edit) => result.slice(0, edit.from) + result.slice(edit.to),
    text,
  );
}

describe("paragraph command", () => {
  it("removes the heading prefix on the cursor line", () => {
    expect(applyEdits("above\n## Heading\nbelow", 9, 9)).toBe("above\nHeading\nbelow");
  });
  it("removes prefixes on every selected line", () => {
    const text = "# One\n## Two\nplain\n### Three\nlast";
    expect(applyEdits(text, 0, text.indexOf("\nlast"))).toBe("One\nTwo\nplain\nThree\nlast");
  });
  it("does not alter the line immediately after a selection", () => {
    expect(applyEdits("# One\n# Two", 0, 6)).toBe("One\n# Two");
  });
});
