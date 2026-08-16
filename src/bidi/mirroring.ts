import { BIDI_MIRRORING_PAIRS } from "./data/bidi-pairs.generated.js";

const MIRRORING = new Map<number, number>(BIDI_MIRRORING_PAIRS);

/** Return the Unicode Bidi_Mirroring_Glyph for a code point, if defined. */
export function mirroredCodePoint(codePoint: number): number | undefined {
  return MIRRORING.get(codePoint);
}
