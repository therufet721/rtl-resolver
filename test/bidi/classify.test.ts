import { describe, expect, it } from "vitest";
import { bidiClassName, bidiClassOf } from "../../packages/core/src/bidi/classify.js";

describe("Unicode Bidi_Class lookup", () => {
  it("classifies representative LTR, RTL, Arabic, and control characters", () => {
    expect(bidiClassName(0x41)).toBe("L");
    expect(bidiClassName(0x05d0)).toBe("R");
    expect(bidiClassName(0x0627)).toBe("AL");
    expect(bidiClassName(0x2067)).toBe("RLI");
  });

  it("classifies astral code points and defaults unassigned values correctly", () => {
    expect(bidiClassName(0x0028)).toBe("ON");
    expect(bidiClassName(0x0378)).toBe("L");
  });

  it("rejects invalid code points", () => {
    expect(() => bidiClassOf(-1)).toThrow(RangeError);
    expect(() => bidiClassOf(0x110000)).toThrow(RangeError);
  });
});
