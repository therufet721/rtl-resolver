import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { resolveParagraphs } from "../../packages/core/src/bidi/paragraphs.js";
import { resolveExplicit } from "../../packages/core/src/bidi/explicit.js";
import { buildIsolatingRunSequences } from "../../packages/core/src/bidi/isolating-runs.js";
import { resolveWeakTypes } from "../../packages/core/src/bidi/weak.js";

function types(text: string) {
  const state = resolveExplicit(resolveParagraphs(decodeCodePoints(text))[0]);
  const sequence = buildIsolatingRunSequences(state)[0];
  resolveWeakTypes(state, sequence);
  return [...sequence.indices].map((index) => state.resolvedTypes[index]);
}

describe("W1-W7 weak resolution", () => {
  it("converts Arabic letters to R and European numbers after Arabic to AN", () => {
    expect(types("ا123")).toEqual([1, 6, 6, 6]);
  });

  it("turns separators between European numbers into EN", () => {
    expect(types("א1,2")).toEqual([1, 3, 3, 3]);
  });

  it("turns an ET run adjacent to EN into EN", () => {
    expect(types("א$12")).toEqual([1, 3, 3, 3]);
  });

  it("keeps a common separator between Arabic numbers as AN", () => {
    expect(types("ا١،٢")).toEqual([1, 6, 6, 6]);
  });

  it("resolves European numbers after Latin text to L", () => {
    expect(types("a12")).toEqual([0, 0, 0]);
  });
});
