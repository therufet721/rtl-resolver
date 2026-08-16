import { BIDI_STAGE_1, BIDI_STAGE_2 } from "./data/bidi.generated.js";
import { InputFlags } from "./types.js";

export type BidiClassCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22;

/** Numeric class names in the same order as the generated table. */
export const BIDI_CLASS_NAMES = [
  "L", "R", "AL", "EN", "ES", "ET", "AN", "CS", "NSM", "BN", "B", "S", "WS", "ON",
  "LRE", "RLE", "LRO", "RLO", "PDF", "LRI", "RLI", "FSI", "PDI"
] as const;

export function bidiClassOf(codePoint: number): BidiClassCode {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    throw new RangeError(`Invalid Unicode code point: ${codePoint}`);
  }
  const page = BIDI_STAGE_1[codePoint >>> 8];
  return BIDI_STAGE_2[(page << 8) | (codePoint & 0xff)] as BidiClassCode;
}

export function bidiClassName(codePoint: number): (typeof BIDI_CLASS_NAMES)[number] {
  return BIDI_CLASS_NAMES[bidiClassOf(codePoint)];
}

export function hasStrongRtl(codePoint: number): boolean {
  const type = bidiClassOf(codePoint);
  return type === 1 || type === 2;
}

export function hasStrongLtr(codePoint: number): boolean {
  return bidiClassOf(codePoint) === 0;
}
