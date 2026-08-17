import type { ExplicitState } from "./explicit.js";
import type { IsolatingRunSequence } from "./isolating-runs.js";

const L = 0;
const R = 1;
const EN = 3;
const AN = 6;
const WS = 12;
const ON = 13;
const S = 11;
const B = 10;
const LRI = 19;
const RLI = 20;
const FSI = 21;
const PDI = 22;

function direction(type: number): 0 | 1 | undefined {
  if (type === L) return 0;
  if (type === R || type === EN || type === AN) return 1;
  return undefined;
}

function isNeutral(type: number): boolean {
  return type === WS || type === ON || type === S || type === B ||
    type === LRI || type === RLI || type === FSI || type === PDI;
}

/** Apply N1-N2 after N0 has resolved bracket types. */
export function resolveNeutrals(state: ExplicitState, sequence: IsolatingRunSequence): void {
  let start = 0;
  while (start < sequence.indices.length) {
    if (!isNeutral(state.resolvedTypes[sequence.indices[start]])) {
      start++;
      continue;
    }
    let end = start + 1;
    while (end < sequence.indices.length && isNeutral(state.resolvedTypes[sequence.indices[end]])) end++;
    const before = start > 0 ? direction(state.resolvedTypes[sequence.indices[start - 1]]) : sequence.sos;
    const after = end < sequence.indices.length ? direction(state.resolvedTypes[sequence.indices[end]]) : sequence.eos;
    const resolved = before !== undefined && before === after ? before : (state.levels[sequence.indices[start]] & 1) as 0 | 1;
    for (let i = start; i < end; i++) state.resolvedTypes[sequence.indices[i]] = resolved;
    start = end;
  }
}
