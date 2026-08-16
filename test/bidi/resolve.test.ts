import { describe, expect, it } from "vitest";
import { analyzeBidi, reorderBidi, resolveBidiLevels } from "../../src/bidi/resolve.js";

describe("bidi resolution pipeline", () => {
  it("returns final levels for mixed-direction text", () => {
    const result = resolveBidiLevels("Hello שלום!");
    expect(result.paragraphs[0].baseLevel).toBe(0);
    expect(result.paragraphs[0].levels.length).toBe(11);
    expect(result.paragraphs[0].levels[6]).toBe(1);
  });

  it("returns line-local visual/logical mappings", () => {
    const result = analyzeBidi("abc אבג");
    const line = result.paragraphs[0].lines[0];
    expect(line.visualToLogical.length).toBe(7);
    expect(line.logicalToVisual.length).toBe(7);
    expect(line.visualRuns.length).toBeGreaterThan(0);
  });

  it("offers a reordered diagnostic string", () => {
    expect(reorderBidi("abc אבג")).toBeTruthy();
  });

  it("reorders supplied soft lines independently", () => {
    const result = analyzeBidi("abc אבג xyz", { lineEnds: [7] });
    expect(result.paragraphs[0].lines).toHaveLength(2);
    expect(result.paragraphs[0].lines[0].codePointEnd).toBe(7);
  });

  it("rejects line boundaries outside paragraph content", () => {
    expect(() => analyzeBidi("abc", { lineEnds: [3] })).toThrow(RangeError);
  });

  it("applies L1 to original trailing whitespace types", () => {
    const result = analyzeBidi("אב ");
    expect(result.paragraphs[0].levels[2]).toBe(1);
  });
});
