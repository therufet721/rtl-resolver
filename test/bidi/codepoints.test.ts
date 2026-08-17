import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { InputFlags } from "../../packages/core/src/bidi/types.js";
import { chooseFastPath } from "../../packages/core/src/bidi/scan.js";

describe("decodeCodePoints", () => {
  it("decodes astral characters and preserves UTF-16 spans", () => {
    const result = decodeCodePoints("A😀ב");

    expect([...result.codePoints]).toEqual([0x41, 0x1f600, 0x05d1]);
    expect([...result.utf16Starts]).toEqual([0, 1, 3]);
    expect([...result.utf16Ends]).toEqual([1, 3, 4]);
    expect(result.flags & InputFlags.HasAstral).toBeTruthy();
    expect(result.flags & InputFlags.HasRTL).toBeTruthy();
  });

  it("preserves unpaired surrogates as individual code points", () => {
    const result = decodeCodePoints("\ud800x\udfff");

    expect([...result.codePoints]).toEqual([0xd800, 0x78, 0xdfff]);
    expect([...result.utf16Starts]).toEqual([0, 1, 2]);
    expect([...result.utf16Ends]).toEqual([1, 2, 3]);
  });

  it("collects controls, isolates, brackets, and separators in the same pass", () => {
    const result = decodeCodePoints("(\u2067أ\u2069)\n");

    expect(result.flags & InputFlags.HasControls).toBeTruthy();
    expect(result.flags & InputFlags.HasIsolates).toBeTruthy();
    expect(result.flags & InputFlags.HasBrackets).toBeTruthy();
    expect(result.flags & InputFlags.HasSeparators).toBeTruthy();
    expect(result.flags & InputFlags.HasRTL).toBeTruthy();
  });

  it("handles empty input without allocating logical entries", () => {
    const result = decodeCodePoints("");

    expect(result.codePoints.length).toBe(0);
    expect(result.utf16Starts.length).toBe(0);
    expect(result.utf16Ends.length).toBe(0);
    expect(chooseFastPath(result.flags, result.codePoints.length)).toBe("empty");
  });
});

describe("chooseFastPath", () => {
  it("selects the safe ASCII path only when no special flags exist", () => {
    expect(chooseFastPath(InputFlags.None, 3)).toBe("ascii-ltr");
    expect(chooseFastPath(InputFlags.HasRTL, 3)).toBe("full");
  });

  it("rejects the ASCII path for any code point outside printable ASCII", () => {
    // U+00AD is BN: X9 removes it, so the identity reordering the fast path
    // returns would be wrong even though the text carries no other flag.
    const softHyphen = decodeCodePoints("ab\u00adc");
    expect(softHyphen.flags & InputFlags.NotPlainAscii).toBeTruthy();
    expect(chooseFastPath(softHyphen.flags, softHyphen.codePoints.length)).toBe("full");

    // U+0085 is a paragraph separator, which changes the paragraph split.
    const nextLine = decodeCodePoints("a\u0085b");
    expect(chooseFastPath(nextLine.flags, nextLine.codePoints.length)).toBe("full");
  });

  it("keeps the ASCII path for printable ASCII including brackets and digits", () => {
    const result = decodeCodePoints("a (b) 12-3\tx");
    expect(chooseFastPath(result.flags, result.codePoints.length)).toBe("ascii-ltr");
  });
});
