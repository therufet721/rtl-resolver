import { describe, expect, it } from "vitest";
import { analyzeBidi, analyzeBidiFull, resolveBidiLevels, resolveBidiLevelsFull } from "../../packages/core/src/bidi/resolve.js";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { chooseFastPath } from "../../packages/core/src/bidi/scan.js";

/** Deterministic PRNG so a failure reproduces from the printed seed. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One character per Bidi_Class plus a spread of plain ASCII, so generated
// strings straddle the fast path boundary in both directions.
const ALPHABET = [
  ..."abcXYZ 0123()[]{}<>+-,.%$!?\t",
  "א", "ا", "٠", "̀", "­", " ", "",
  " ", " ", "‎", "‏", "؜",
  "‪", "‫", "‬", "‭", "‮",
  "⁦", "⁧", "⁨", "⁩",
  "\u{10800}", "\u{1e900}",
];

function randomText(random: () => number, maxLength: number): string {
  const length = Math.floor(random() * maxLength);
  let text = "";
  for (let i = 0; i < length; i++) text += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return text;
}

describe("ASCII fast path", () => {
  it("agrees with the full pipeline on random input", () => {
    const random = mulberry32(0x5eed);
    let fastPathHits = 0;
    for (let iteration = 0; iteration < 4000; iteration++) {
      const text = randomText(random, 24);
      const buffer = decodeCodePoints(text);
      if (chooseFastPath(buffer.flags, buffer.codePoints.length) === "ascii-ltr") fastPathHits++;

      const fast = analyzeBidi(text);
      const full = analyzeBidiFull(text);
      const context = () => `iteration ${iteration}: ${JSON.stringify(text)}`;

      expect(fast.paragraphs.length, context()).toBe(full.paragraphs.length);
      fast.paragraphs.forEach((paragraph, index) => {
        const expected = full.paragraphs[index];
        expect([...paragraph.levels], context()).toEqual([...expected.levels]);
        expect(paragraph.baseLevel, context()).toBe(expected.baseLevel);
        expect(paragraph.codePointStart, context()).toBe(expected.codePointStart);
        expect(paragraph.codePointEnd, context()).toBe(expected.codePointEnd);
        expect(paragraph.utf16End, context()).toBe(expected.utf16End);
        expect(paragraph.lines.length, context()).toBe(expected.lines.length);
        paragraph.lines.forEach((line, lineIndex) => {
          const expectedLine = expected.lines[lineIndex];
          expect([...line.visualToLogical], context()).toEqual([...expectedLine.visualToLogical]);
          expect([...line.logicalToVisual], context()).toEqual([...expectedLine.logicalToVisual]);
          expect(line.logicalRuns, context()).toEqual(expectedLine.logicalRuns);
          expect(line.visualRuns, context()).toEqual(expectedLine.visualRuns);
        });
      });

      const fastLevels = resolveBidiLevels(text).paragraphs.map((p) => [...p.levels]);
      const fullLevels = resolveBidiLevelsFull(text).paragraphs.map((p) => [...p.levels]);
      expect(fastLevels, context()).toEqual(fullLevels);
    }
    // Guard against the alphabet drifting until the fast path is never taken,
    // which would make the whole property vacuous.
    expect(fastPathHits).toBeGreaterThan(50);
  });

  it("agrees with the full pipeline on pure ASCII input", () => {
    const random = mulberry32(0xc0ffee);
    const ascii = "abcXYZ 0123()[]{}<>+-,.%$!?\t";
    for (let iteration = 0; iteration < 2000; iteration++) {
      const length = Math.floor(random() * 32);
      let text = "";
      for (let i = 0; i < length; i++) text += ascii[Math.floor(random() * ascii.length)];
      const context = `iteration ${iteration}: ${JSON.stringify(text)}`;

      const fast = analyzeBidi(text).paragraphs[0];
      const full = analyzeBidiFull(text).paragraphs[0];
      expect([...fast.levels], context).toEqual([...full.levels]);
      expect([...fast.lines[0].visualToLogical], context).toEqual([...full.lines[0].visualToLogical]);
      expect(fast.lines[0].logicalRuns, context).toEqual(full.lines[0].logicalRuns);
    }
  });
});
