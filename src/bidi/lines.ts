import type { ExplicitState } from "./explicit.js";

const B = 10;
const S = 11;
const WS = 12;
const LRI = 19;
const RLI = 20;
const FSI = 21;
const PDI = 22;

/**
 * L1 resets whitespace and isolate formatting characters to the paragraph
 * level. Both the "preceding a separator" and "end of line" sequences may also
 * contain characters X9 removed (BN and explicit formatting controls), which
 * stay transparent here rather than terminating the run.
 */
function isResettable(state: ExplicitState, position: number): boolean {
  if (state.removed[position]) return true;
  const type = state.types[position];
  return type === WS || type === LRI || type === RLI || type === FSI || type === PDI;
}

/** Apply L1 to one line, using original types rather than resolved ones. */
export function applyL1(state: ExplicitState, start = 0, end = state.levels.length): void {
  for (let i = start; i < end; i++) {
    // L1 uses original paragraph/segment separator types. W/N rules may have
    // changed the working type to L/R by this point.
    const type = state.types[i];
    if (type !== B && type !== S) continue;
    state.levels[i] = state.level;
    for (let j = i - 1; j >= start && isResettable(state, j); j--) state.levels[j] = state.level;
  }
  for (let i = end - 1; i >= start && isResettable(state, i); i--) state.levels[i] = state.level;
}
