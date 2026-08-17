import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { resolveParagraphs } from "../../packages/core/src/bidi/paragraphs.js";
import { resolveExplicit } from "../../packages/core/src/bidi/explicit.js";

function explicit(text: string, direction: "ltr" | "rtl" | "auto" = "auto") {
  return resolveExplicit(resolveParagraphs(decodeCodePoints(text), direction)[0]);
}

describe("X1-X9 explicit levels", () => {
  it("keeps explicit levels at the paragraph level before implicit resolution", () => {
    const state = explicit("aאב");
    expect([...state.levels]).toEqual([0, 0, 0]);
    expect([...state.resolvedTypes]).toEqual([0, 1, 1]);
  });

  it("removes embedding controls while preserving stable positions", () => {
    const state = explicit("a\u202Bab\u202Cz");
    expect(state.removed[1]).toBe(1);
    expect(state.removed[4]).toBe(1);
    expect(state.levels[2]).toBe(1);
    expect(state.levels[3]).toBe(1);
    expect(state.levels[5]).toBe(0);
  });

  it("honors an explicit override", () => {
    const state = explicit("a\u202Db\u202Cz");
    expect([...state.resolvedTypes]).toEqual([0, 9, 0, 9, 0]);
  });

  it("removes BN characters under X9", () => {
    const state = explicit("A\u200Dא");
    expect(state.removed[1]).toBe(1);
  });
});
