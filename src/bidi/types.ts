/** Internal input features used to choose a safe fast path. */
export const enum InputFlags {
  None = 0,
  HasRTL = 1 << 0,
  HasControls = 1 << 1,
  HasIsolates = 1 << 2,
  HasBrackets = 1 << 3,
  HasSeparators = 1 << 4,
  HasAstral = 1 << 5,
  /**
   * Set for any code point outside the printable-ASCII range (plus TAB). Every
   * character in that range resolves to level 0 in an LTR paragraph and is
   * kept in the visual output, which is exactly what the fast path assumes.
   */
  NotPlainAscii = 1 << 6,
}

export interface CodePointBuffer {
  readonly text: string;
  /** One Unicode scalar value (or one unpaired surrogate) per entry. */
  readonly codePoints: Uint32Array;
  /** Document-global UTF-16 start offsets for each code point. */
  readonly utf16Starts: Uint32Array;
  /** Exclusive document-global UTF-16 end offsets for each code point. */
  readonly utf16Ends: Uint32Array;
  readonly flags: InputFlags;
}
