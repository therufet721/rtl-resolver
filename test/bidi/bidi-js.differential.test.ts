import bidiFactory from "bidi-js";
import { describe, expect, it } from "vitest";
import { analyzeBidi } from "../../packages/core/src/bidi/resolve.js";

const bidi = bidiFactory();

describe("optional bidi-js differential signal", () => {
  it.each([
    "plain ASCII",
    "Hello שלום",
    "مرحبا 123",
    "abc (אבג) 123",
    "English, العربية, עברית",
  ])("agrees on curated BMP text: %s", (text) => {
    const ours = analyzeBidi(text);
    const theirs = bidi.getEmbeddingLevels(text);
    expect(ours.paragraphs.flatMap((paragraph) => Array.from(paragraph.levels))).toEqual(
      Array.from(theirs.levels),
    );
    expect(Array.from(ours.paragraphs[0]?.lines[0]?.visualToLogical ?? [])).toEqual(
      bidi.getReorderedIndices(text, theirs),
    );
  });
});
