import { InputFlags, type CodePointBuffer } from "./types.js";

const RTL_START = 0x0590;
const RTL_END = 0x08ff;

function isRtlCandidate(codePoint: number): boolean {
  return (codePoint >= RTL_START && codePoint <= RTL_END) ||
    (codePoint >= 0xfb1d && codePoint <= 0xfeff);
}

function isControl(codePoint: number): boolean {
  switch (codePoint) {
    case 0x061c: // ALM
    case 0x200e: // LRM
    case 0x200f: // RLM
    case 0x202a: // LRE
    case 0x202b: // RLE
    case 0x202c: // PDF
    case 0x202d: // LRO
    case 0x202e: // RLO
    case 0x2066: // LRI
    case 0x2067: // RLI
    case 0x2068: // FSI
    case 0x2069: // PDI
      return true;
    default:
      return false;
  }
}

function isIsolate(codePoint: number): boolean {
  return codePoint >= 0x2066 && codePoint <= 0x2069;
}

function isBracket(codePoint: number): boolean {
  return codePoint === 0x0028 || codePoint === 0x0029 ||
    codePoint === 0x005b || codePoint === 0x005d ||
    codePoint === 0x007b || codePoint === 0x007d ||
    codePoint === 0x003c || codePoint === 0x003e ||
    (codePoint >= 0x2308 && codePoint <= 0x2329) ||
    (codePoint >= 0x2768 && codePoint <= 0x2775) ||
    (codePoint >= 0x27e6 && codePoint <= 0x27ef) ||
    (codePoint >= 0x2983 && codePoint <= 0x2998);
}

function isSeparator(codePoint: number): boolean {
  return codePoint === 0x000a || codePoint === 0x000b ||
    codePoint === 0x000c || codePoint === 0x000d ||
    (codePoint >= 0x001c && codePoint <= 0x001e) ||
    codePoint === 0x2028 || codePoint === 0x2029;
}

/**
 * Decode a JavaScript string once into code points and UTF-16 spans.
 * Unpaired surrogates are preserved as individual values.
 */
export function decodeCodePoints(text: string): CodePointBuffer {
  // text.length is a safe upper bound because every code point occupies at
  // least one UTF-16 code unit. Slices avoid retaining unused capacity.
  const capacity = text.length;
  const codePoints = new Uint32Array(capacity);
  const utf16Starts = new Uint32Array(capacity);
  const utf16Ends = new Uint32Array(capacity);
  let count = 0;
  let flags = InputFlags.None;

  for (let offset = 0; offset < text.length;) {
    const start = offset;
    const first = text.charCodeAt(offset++);
    let codePoint = first;

    if (first >= 0xd800 && first <= 0xdbff && offset < text.length) {
      const second = text.charCodeAt(offset);
      if (second >= 0xdc00 && second <= 0xdfff) {
        codePoint = 0x10000 + ((first - 0xd800) << 10) + (second - 0xdc00);
        offset++;
        flags |= InputFlags.HasAstral;
      }
    }

    codePoints[count] = codePoint;
    utf16Starts[count] = start;
    utf16Ends[count] = offset;
    count++;

    if (codePoint > 0x7e || (codePoint < 0x20 && codePoint !== 0x09)) flags |= InputFlags.NotPlainAscii;
    if (isRtlCandidate(codePoint)) flags |= InputFlags.HasRTL;
    if (isControl(codePoint)) flags |= InputFlags.HasControls;
    if (isIsolate(codePoint)) flags |= InputFlags.HasIsolates;
    if (isBracket(codePoint)) flags |= InputFlags.HasBrackets;
    if (isSeparator(codePoint)) flags |= InputFlags.HasSeparators;
  }

  return {
    text,
    codePoints: codePoints.subarray(0, count),
    utf16Starts: utf16Starts.subarray(0, count),
    utf16Ends: utf16Ends.subarray(0, count),
    flags,
  };
}
