import { bidiClassOf, type BidiClassCode } from "./classify.js";
import type { CodePointBuffer } from "./types.js";

export interface Paragraph {
  /** Document-global code-point range, including a terminating B if present. */
  start: number;
  end: number;
  level: 0 | 1;
  codePoints: Uint32Array;
  types: Uint8Array;
  matchingPdi: Int32Array;
  matchingInitiator: Int32Array;
}

const L = 0;
const R = 1;
const AL = 2;
const B = 10;
const LRI = 19;
const RLI = 20;
const FSI = 21;
const PDI = 22;

function isIsolateInitiator(type: number): boolean {
  return type === LRI || type === RLI || type === FSI;
}

function findIsolateMatches(types: Uint8Array): { matchingPdi: Int32Array; matchingInitiator: Int32Array } {
  const matchingPdi = new Int32Array(types.length).fill(-1);
  const matchingInitiator = new Int32Array(types.length).fill(-1);
  const stack: number[] = [];
  for (let i = 0; i < types.length; i++) {
    if (isIsolateInitiator(types[i])) stack.push(i);
    else if (types[i] === PDI && stack.length) {
      const opener = stack.pop()!;
      matchingPdi[opener] = i;
      matchingInitiator[i] = opener;
    }
  }
  return { matchingPdi, matchingInitiator };
}

function paragraphLevel(
  types: Uint8Array,
  matchingPdi: Int32Array,
  forced: "ltr" | "rtl" | "auto"
): 0 | 1 {
  if (forced === "ltr") return 0;
  if (forced === "rtl") return 1;
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    if (type === L) return 0;
    if (type === R || type === AL) return 1;
    if (isIsolateInitiator(type)) {
      const pdi = matchingPdi[i];
      if (pdi >= i) i = pdi;
      else break; // unmatched isolate consumes the rest of the paragraph
    }
  }
  return 0;
}

/** Classify and split a decoded string according to P1-P3. */
export function resolveParagraphs(
  buffer: CodePointBuffer,
  forced: "ltr" | "rtl" | "auto" = "auto"
): Paragraph[] {
  const allTypes = new Uint8Array(buffer.codePoints.length);
  for (let i = 0; i < allTypes.length; i++) allTypes[i] = bidiClassOf(buffer.codePoints[i]);

  const paragraphs: Paragraph[] = [];
  let start = 0;
  for (let i = 0; i < allTypes.length; i++) {
    if (allTypes[i] !== B) continue;
    addParagraph(start, i + 1);
    start = i + 1;
  }
  if (start < allTypes.length || allTypes.length === 0) addParagraph(start, allTypes.length);

  return paragraphs;

  function addParagraph(endStart: number, end: number): void {
    const types = allTypes.slice(endStart, end);
    const matches = findIsolateMatches(types);
    paragraphs.push({
      start: endStart,
      end,
      level: paragraphLevel(types, matches.matchingPdi, forced),
      codePoints: buffer.codePoints.slice(endStart, end),
      types,
      ...matches,
    });
  }
}
