import { describe, expect, it } from "vitest";
import { analyzeBidi, resolveBidiLevels } from "../../src/bidi/resolve.js";

const RLE = "‫";
const RLI = "⁧";
const PDI = "⁩";
const TAB = "	";

describe("L1 whitespace and separator resets", () => {
  it("resets whitespace preceding a segment separator", () => {
    // In an RTL paragraph the Latin text sits at level 2 and so does the
    // whitespace between it and the tab. L1 pulls both the separator and the
    // whitespace run in front of it back to the paragraph level.
    const levels = [...resolveBidiLevels(`abc ${TAB}def`, { baseDirection: "rtl" }).paragraphs[0].levels];
    expect(levels).toEqual([2, 2, 2, 1, 1, 2, 2, 2]);
  });

  it("resets isolate formatting characters preceding a segment separator", () => {
    // The RLI/PDI pair resolves to level 1 next to the Hebrew letter, then L1
    // resets it because isolate formatting characters join the reset run.
    const levels = [...resolveBidiLevels(`א${RLI}${PDI}${TAB}א`, { baseDirection: "ltr" }).paragraphs[0].levels];
    expect(levels).toEqual([1, 0, 0, 0, 1]);
  });

  it("resets trailing whitespace and isolate formatting characters together", () => {
    // Inside the RTL embedding the trailing space and PDI both resolve to
    // level 1; at the end of the line they return to the paragraph level.
    const levels = [...resolveBidiLevels(`${RLE}abc ${PDI}`, { baseDirection: "ltr" }).paragraphs[0].levels];
    expect(levels).toEqual([0, 2, 2, 2, 0, 0]);
  });

  it("keeps interior whitespace at its resolved level", () => {
    const levels = [...resolveBidiLevels("אבג אבג", { baseDirection: "rtl" }).paragraphs[0].levels];
    expect(levels[3]).toBe(1);
  });
});

describe("L2 reordering and the optional L3 tailoring", () => {
  const text = "א(ב)̱"; // R ON R ON NSM

  it("reverses combining marks with their base by default", () => {
    const order = [...analyzeBidi(text).paragraphs[0].lines[0].visualToLogical];
    expect(order).toEqual([4, 3, 2, 1, 0]);
  });

  it("keeps a combining mark beside its base when L3 is requested", () => {
    const order = [...analyzeBidi(text, { applyL3: true }).paragraphs[0].lines[0].visualToLogical];
    expect(order).toEqual([3, 4, 2, 1, 0]);
  });
});
