import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../src/bidi/codepoints.js";
import { resolveParagraphs } from "../../src/bidi/paragraphs.js";
import { resolveExplicit } from "../../src/bidi/explicit.js";
import { buildIsolatingRunSequences } from "../../src/bidi/isolating-runs.js";

describe("X10 active level runs", () => {
  it("emits active positions only and records sos/eos", () => {
    const state = resolveExplicit(resolveParagraphs(decodeCodePoints("a\u202Bb\u202Cc"))[0]);
    const sequences = buildIsolatingRunSequences(state);
    expect(sequences).toHaveLength(3);
    expect([...sequences.flatMap((sequence) => [...sequence.indices])]).toEqual([0, 2, 4]);
    expect(sequences[0].sos).toBe(0);
    expect(sequences[2].eos).toBe(0);
  });

  it("links an isolate initiator run to the run after its matching PDI", () => {
    const state = resolveExplicit(resolveParagraphs(decodeCodePoints("a\u2067שלום\u2069b"))[0]);
    const sequences = buildIsolatingRunSequences(state);
    expect(sequences.some((sequence) => [...sequence.indices].join(",") === "0,1,6,7")).toBe(true);
  });
});
