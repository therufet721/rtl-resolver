import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { resolveParagraphs } from "../../packages/core/src/bidi/paragraphs.js";
import { resolveExplicit } from "../../packages/core/src/bidi/explicit.js";
import { buildIsolatingRunSequences } from "../../packages/core/src/bidi/isolating-runs.js";
import { resolveWeakTypes } from "../../packages/core/src/bidi/weak.js";
import { resolveBrackets } from "../../packages/core/src/bidi/brackets.js";
import { resolveNeutrals } from "../../packages/core/src/bidi/neutral.js";
import { resolveImplicitLevels } from "../../packages/core/src/bidi/implicit.js";

function levels(text: string) {
  const state = resolveExplicit(resolveParagraphs(decodeCodePoints(text))[0]);
  for (const sequence of buildIsolatingRunSequences(state)) {
    resolveWeakTypes(state, sequence);
    resolveBrackets(state, sequence);
    resolveNeutrals(state, sequence);
    resolveImplicitLevels(state, sequence);
  }
  return [...state.levels];
}

describe("I1-I2 implicit levels", () => {
  it("raises R characters inside an LTR paragraph", () => {
    expect(levels("aאב")).toEqual([0, 1, 1]);
  });

  it("raises European and Arabic numbers by the required parity", () => {
    // W7 resolves European numbers following L to L before I1.
    expect(levels("a12")).toEqual([0, 0, 0]);
    expect(levels("א12")).toEqual([1, 2, 2]);
  });
});
