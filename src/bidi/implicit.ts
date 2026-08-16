import type { ExplicitState } from "./explicit.js";
import type { IsolatingRunSequence } from "./isolating-runs.js";

const L = 0;
const R = 1;
const EN = 3;
const AN = 6;

/** Apply I1-I2 to the active positions of one isolating run sequence. */
export function resolveImplicitLevels(state: ExplicitState, sequence: IsolatingRunSequence): void {
  for (const position of sequence.indices) {
    const level = state.levels[position];
    const type = state.resolvedTypes[position];
    if ((level & 1) === 0) {
      if (type === R) state.levels[position] = level + 1;
      else if (type === EN || type === AN) state.levels[position] = level + 2;
    } else if (type === L || type === EN || type === AN) {
      state.levels[position] = level + 1;
    }
  }
}
