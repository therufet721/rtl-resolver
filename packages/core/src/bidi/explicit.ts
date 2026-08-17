import type { Paragraph } from "./paragraphs.js";

export interface ExplicitState extends Paragraph {
  resolvedTypes: Uint8Array;
  levels: Uint8Array;
  removed: Uint8Array;
}

const L = 0;
const R = 1;
const LRE = 14;
const RLE = 15;
const LRO = 16;
const RLO = 17;
const PDF = 18;
const LRI = 19;
const RLI = 20;
const FSI = 21;
const PDI = 22;
const BN = 9;
const B = 10;
const MAX_DEPTH = 125;

interface StackEntry {
  level: number;
  override: 0 | 1 | -1;
  isolate: boolean;
}

function leastGreater(level: number, direction: 0 | 1): number {
  const candidate = level + 1;
  return (candidate & 1) === direction ? candidate : candidate + 1;
}

function firstStrongInIsolate(state: Paragraph, start: number, end: number): 0 | 1 {
  for (let i = start + 1; i < end; i++) {
    const type = state.types[i];
    if (type === L) return 0;
    if (type === R || type === 2) return 1;
    if (type === LRI || type === RLI || type === FSI) {
      const pdi = state.matchingPdi[i];
      if (pdi >= i && pdi < end) i = pdi;
      else break;
    }
  }
  return 0;
}

/** Apply X1-X9 to a paragraph. Formatting controls remain index-stable but are marked removed. */
export function resolveExplicit(paragraph: Paragraph): ExplicitState {
  const resolvedTypes = paragraph.types.slice();
  const levels = new Uint8Array(paragraph.types.length);
  const removed = new Uint8Array(paragraph.types.length);
  const stack: StackEntry[] = [{ level: paragraph.level, override: -1, isolate: false }];
  let overflowIsolate = 0;
  let overflowEmbedding = 0;
  let validIsolates = 0;

  for (let i = 0; i < paragraph.types.length; i++) {
    const type = paragraph.types[i];
    const current = stack[stack.length - 1];
    levels[i] = current.level;

    // X9 removes BN characters along with explicit embedding controls.
    if (type === BN) {
      removed[i] = 1;
      resolvedTypes[i] = BN;
      continue;
    }

    if (type === LRE || type === RLE || type === LRO || type === RLO) {
      removed[i] = 1;
      resolvedTypes[i] = 9; // BN while retained internally
      const direction: 0 | 1 = type === RLE || type === RLO ? 1 : 0;
      const newLevel = leastGreater(current.level, direction);
      // X2-X5: an embedding is valid only when the new level fits and neither
      // overflow counter is already set.
      if (newLevel <= MAX_DEPTH && overflowIsolate === 0 && overflowEmbedding === 0) {
        if (type === LRO || type === RLO) stack.push({ level: newLevel, override: direction, isolate: false });
        else stack.push({ level: newLevel, override: -1, isolate: false });
      } else if (overflowIsolate === 0) {
        overflowEmbedding++;
      }
      continue;
    }

    if (type === PDF) {
      removed[i] = 1;
      resolvedTypes[i] = 9;
      // X7: PDFs inside isolate overflow are ignored completely.
      if (overflowIsolate === 0) {
        if (overflowEmbedding > 0) overflowEmbedding--;
        else if (stack.length > 1 && !stack[stack.length - 1].isolate) stack.pop();
      }
      continue;
    }

    if (type === LRI || type === RLI || type === FSI) {
      const direction: 0 | 1 = type === LRI ? 0 : type === RLI ? 1 : firstStrongInIsolate(paragraph, i, paragraph.matchingPdi[i] >= 0 ? paragraph.matchingPdi[i] : paragraph.types.length);
      const newLevel = leastGreater(current.level, direction);
      // X5a-X5c: the initiator itself stays at the current level and picks up
      // the current override before the new level is pushed.
      if (current.override !== -1) resolvedTypes[i] = current.override;
      if (newLevel <= MAX_DEPTH && overflowIsolate === 0 && overflowEmbedding === 0) {
        stack.push({ level: newLevel, override: -1, isolate: true });
        validIsolates++;
      } else {
        overflowIsolate++;
      }
      continue;
    }

    if (type === PDI) {
      if (overflowIsolate > 0) overflowIsolate--;
      else if (validIsolates > 0) {
        // X6a: closing a valid isolate discards any embedding overflow that
        // accumulated inside it.
        overflowEmbedding = 0;
        while (stack.length > 1) {
          const entry = stack.pop()!;
          if (entry.isolate) break;
        }
        validIsolates--;
      }
      // X6a: the PDI takes the level and override of the entry left on the
      // stack, which always matches its isolate initiator.
      const restored = stack[stack.length - 1];
      levels[i] = restored.level;
      if (restored.override !== -1) resolvedTypes[i] = restored.override;
      continue;
    }

    if (type === B) {
      // X8: a paragraph separator terminates every embedding and override, so
      // it takes the paragraph embedding level and keeps its own type.
      levels[i] = paragraph.level;
      continue;
    }

    if (current.override !== -1) resolvedTypes[i] = current.override;
    levels[i] = current.level;
  }

  return { ...paragraph, resolvedTypes, levels, removed };
}
