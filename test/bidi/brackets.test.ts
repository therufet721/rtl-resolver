import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../src/bidi/codepoints.js";
import { resolveParagraphs } from "../../src/bidi/paragraphs.js";
import { resolveExplicit } from "../../src/bidi/explicit.js";
import { buildIsolatingRunSequences } from "../../src/bidi/isolating-runs.js";
import { resolveWeakTypes } from "../../src/bidi/weak.js";
import { findBracketPairs, resolveBrackets } from "../../src/bidi/brackets.js";
import { resolveNeutrals } from "../../src/bidi/neutral.js";

function resolve(text: string) {
  const state = resolveExplicit(resolveParagraphs(decodeCodePoints(text))[0]);
  const sequence = buildIsolatingRunSequences(state)[0];
  resolveWeakTypes(state, sequence);
  const pairs = findBracketPairs(state, sequence);
  resolveBrackets(state, sequence);
  resolveNeutrals(state, sequence);
  return { state, sequence, pairs };
}

describe("N0-N2 neutral and bracket resolution", () => {
  it("pairs nested ASCII brackets", () => {
    const { pairs } = resolve("א(12)");
    expect(pairs).toEqual([{ open: 1, close: 4 }]);
  });

  it("resolves neutral punctuation between matching strong directions", () => {
    const { state, sequence } = resolve("א,ב");
    expect(state.resolvedTypes[1]).toBe(1);
    expect(sequence.indices.length).toBe(3);
  });

  it("resolves unmatched neutrals to the embedding direction", () => {
    const { state } = resolve("hello!");
    expect(state.resolvedTypes[5]).toBe(0);
  });

  it("recognizes the canonical-equivalent angle bracket pair", () => {
    const { pairs } = resolve("א\u232912\u3009");
    expect(pairs).toEqual([{ open: 1, close: 4 }]);
  });

  it("treats isolate formatting as neutral-in-isolate context", () => {
    const { state } = resolve("a\u2067\u2069b");
    expect(state.resolvedTypes[1]).toBe(0);
    expect(state.resolvedTypes[2]).toBe(0);
  });
});
