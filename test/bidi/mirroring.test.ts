import { describe, expect, it } from "vitest";
import { mirroredCodePoint } from "../../src/bidi/mirroring.js";

describe("Unicode mirroring lookup", () => {
  it("returns mirrored bracket code points", () => {
    expect(mirroredCodePoint(0x28)).toBe(0x29);
    expect(mirroredCodePoint(0x29)).toBe(0x28);
  });

  it("returns undefined for non-mirrored characters", () => {
    expect(mirroredCodePoint(0x41)).toBeUndefined();
  });
});
