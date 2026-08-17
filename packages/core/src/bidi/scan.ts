import { InputFlags } from "./types.js";

export type FastPath = "empty" | "ascii-ltr" | "full";

/**
 * Decide whether the complete bidi pipeline is required.
 *
 * The only shortcut taken is text made entirely of printable ASCII (plus TAB)
 * with an LTR base direction. For that input every character resolves to level
 * 0 — European numbers become L under W7 because sos is L and no R/AL exists,
 * the remaining neutrals resolve to L under N1/N2, and L1 only ever resets to
 * level 0 — and no character is removed by X9, so the visual order is the
 * logical order. Anything else, including brackets, goes through the full
 * pipeline; brackets alone cannot change the outcome without RTL content.
 */
const BLOCKS_ASCII_PATH =
  InputFlags.NotPlainAscii |
  InputFlags.HasRTL |
  InputFlags.HasControls |
  InputFlags.HasIsolates |
  InputFlags.HasSeparators |
  InputFlags.HasAstral;

export function chooseFastPath(flags: InputFlags, codePointCount: number): FastPath {
  if (codePointCount === 0) return "empty";
  if ((flags & BLOCKS_ASCII_PATH) === 0) return "ascii-ltr";
  return "full";
}
