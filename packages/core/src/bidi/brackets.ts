import type { ExplicitState } from "./explicit.js";
import type { IsolatingRunSequence } from "./isolating-runs.js";
import { BIDI_BRACKET_PAIRS } from "./data/bidi-pairs.generated.js";

const L = 0;
const R = 1;
const EN = 3;
const AN = 6;
const NSM = 8;
const ON = 13;

const PAIRS = new Map<number, number>(BIDI_BRACKET_PAIRS);
const CLOSE_TO_OPEN = new Map(Array.from(PAIRS, ([open, close]) => [close, open]));
const CANONICAL_BRACKETS = new Map<number, number>([
  [0x2329, 0x3008], [0x3008, 0x3008],
  [0x232a, 0x3009], [0x3009, 0x3009],
]);

function canonicalBracket(codePoint: number): number {
  return CANONICAL_BRACKETS.get(codePoint) ?? codePoint;
}

export interface BracketPair { open: number; close: number; }

export function findBracketPairs(state: ExplicitState, sequence: IsolatingRunSequence): BracketPair[] {
  const stack: Array<{ codePoint: number; position: number }> = [];
  const pairs: BracketPair[] = [];
  for (const position of sequence.indices) {
    if (state.resolvedTypes[position] !== ON) continue;
    const codePoint = state.codePoints?.[position];
    if (codePoint === undefined) continue;
    const closeTarget = CLOSE_TO_OPEN.get(codePoint);
    if (closeTarget !== undefined) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (canonicalBracket(stack[i].codePoint) !== canonicalBracket(closeTarget)) continue;
        const opener = stack[i];
        stack.length = i;
        pairs.push({ open: opener.position, close: position });
        break;
      }
    } else if (PAIRS.has(codePoint)) {
      // BD16 bounds the opener stack at 63 entries. Once the bound is hit,
      // stop pairing for the remainder of this isolating-run sequence rather
      // than silently producing pairs from a partially-truncated stack.
      if (stack.length >= 63) break;
      stack.push({ codePoint, position });
    }
  }
  pairs.sort((a, b) => a.open - b.open);
  return pairs;
}

function strongDirection(type: number): 0 | 1 | undefined {
  if (type === L) return 0;
  if (type === R || type === EN || type === AN) return 1;
  return undefined;
}

function applyNsmTail(
  state: ExplicitState,
  sequence: IsolatingRunSequence,
  bracketIndex: number,
  resolved: number
): void {
  for (let i = bracketIndex + 1; i < sequence.indices.length; i++) {
    const position = sequence.indices[i];
    if (state.types[position] !== NSM) break;
    state.resolvedTypes[position] = resolved;
  }
}

/** Apply BD16 and N0. */
export function resolveBrackets(state: ExplicitState, sequence: IsolatingRunSequence): void {
  const pairs = findBracketPairs(state, sequence);
  const positionToIndex = new Map<number, number>();
  sequence.indices.forEach((position, index) => positionToIndex.set(position, index));
  for (const pair of pairs) {
    const openIndex = positionToIndex.get(pair.open)!;
    const closeIndex = positionToIndex.get(pair.close)!;
    const embeddingDirection = (state.levels[pair.open] & 1) as 0 | 1;
    let hasEmbedding = false;
    let hasOpposite = false;
    for (let i = openIndex + 1; i < closeIndex; i++) {
      const direction = strongDirection(state.resolvedTypes[sequence.indices[i]]);
      if (direction === undefined) continue;
      if (direction === embeddingDirection) hasEmbedding = true;
      else hasOpposite = true;
    }
    if (hasEmbedding) {
      state.resolvedTypes[pair.open] = embeddingDirection;
      state.resolvedTypes[pair.close] = embeddingDirection;
    } else if (hasOpposite) {
      let before: 0 | 1 | undefined;
      for (let i = openIndex - 1; i >= 0; i--) {
        before = strongDirection(state.resolvedTypes[sequence.indices[i]]);
        if (before !== undefined) break;
      }
      // If the enclosed strong type is opposite the embedding direction,
      // N0 resolves the brackets to that opposite direction when the
      // preceding strong type (or sos) agrees with it.
      const opposite = (1 - embeddingDirection) as 0 | 1;
      const preceding = before ?? sequence.sos;
      const resolved = preceding === opposite ? opposite : embeddingDirection;
      state.resolvedTypes[pair.open] = resolved;
      state.resolvedTypes[pair.close] = resolved;
    }
    const resolved = state.resolvedTypes[pair.open];
    if (resolved === L || resolved === R) {
      // N0 note: characters whose original type was NSM that immediately
      // follow either bracket of a resolved pair take the bracket's direction.
      // W1 may already have rewritten them, so the original types decide.
      applyNsmTail(state, sequence, openIndex, resolved);
      applyNsmTail(state, sequence, closeIndex, resolved);
    }
  }
}
