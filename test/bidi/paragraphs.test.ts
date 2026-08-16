import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../src/bidi/codepoints.js";
import { resolveParagraphs } from "../../src/bidi/paragraphs.js";

describe("P1-P3 paragraph resolution", () => {
  it("splits on paragraph separators and resolves first strong direction", () => {
    const paragraphs = resolveParagraphs(decodeCodePoints("hello\u2029שלום"));
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].level).toBe(0);
    expect(paragraphs[1].level).toBe(1);
    expect(paragraphs[0].end - paragraphs[0].start).toBe(6);
  });

  it("uses the supplied base direction instead of P2", () => {
    const buffer = decodeCodePoints("hello");
    expect(resolveParagraphs(buffer, "rtl")[0].level).toBe(1);
    expect(resolveParagraphs(buffer, "ltr")[0].level).toBe(0);
  });

  it("skips an isolate span while finding the paragraph first strong type", () => {
    const paragraphs = resolveParagraphs(decodeCodePoints("\u2067שלום\u2069 hello"));
    expect(paragraphs[0].level).toBe(0);
    expect(paragraphs[0].matchingPdi[0]).toBe(5);
    expect(paragraphs[0].matchingInitiator[5]).toBe(0);
  });
});
