import type { ExplicitState } from "./explicit.js";
import type { IsolatingRunSequence } from "./isolating-runs.js";

const L = 0;
const R = 1;
const AL = 2;
const EN = 3;
const ES = 4;
const ET = 5;
const AN = 6;
const CS = 7;
const NSM = 8;
const ON = 13;
const LRI = 19;
const RLI = 20;
const FSI = 21;
const PDI = 22;

/** Apply W1-W7 to one isolating run sequence in rule order. */
export function resolveWeakTypes(state: ExplicitState, sequence: IsolatingRunSequence): void {
  const indices = sequence.indices;
  // W1: NSM takes the previous resolved type, or sos at sequence start. An NSM
  // directly after an isolate initiator or PDI becomes ON instead.
  for (let i = 0; i < indices.length; i++) {
    const position = indices[i];
    if (state.resolvedTypes[position] !== NSM) continue;
    if (i === 0) {
      state.resolvedTypes[position] = sequence.sos;
      continue;
    }
    const previous = state.resolvedTypes[indices[i - 1]];
    state.resolvedTypes[position] =
      previous === LRI || previous === RLI || previous === FSI || previous === PDI ? ON : previous;
  }

  // W2: EN changes to AN when preceded by an AL strong type.
  let previousStrong = sequence.sos === 1 ? R : L;
  for (const position of indices) {
    const type = state.resolvedTypes[position];
    if (type === R || type === L || type === AL) previousStrong = type;
    else if (type === EN && previousStrong === AL) state.resolvedTypes[position] = AN;
  }

  // W3: Arabic letters become R.
  for (const position of indices) {
    if (state.resolvedTypes[position] === AL) state.resolvedTypes[position] = R;
  }

  // W4: a single ES between two ENs becomes EN; a single CS between two
  // numbers of the same type becomes that type. An ES between two ANs is not
  // covered by either clause and stays a separator for W6.
  for (let i = 1; i + 1 < indices.length; i++) {
    const position = indices[i];
    const type = state.resolvedTypes[position];
    if (type !== ES && type !== CS) continue;
    const left = state.resolvedTypes[indices[i - 1]];
    const right = state.resolvedTypes[indices[i + 1]];
    if (left === EN && right === EN) state.resolvedTypes[position] = EN;
    else if (type === CS && left === AN && right === AN) state.resolvedTypes[position] = AN;
  }

  // W5: every ET adjacent to an EN run becomes EN.
  for (let i = 0; i < indices.length; i++) {
    if (state.resolvedTypes[indices[i]] !== EN) continue;
    for (let left = i - 1; left >= 0 && state.resolvedTypes[indices[left]] === ET; left--) state.resolvedTypes[indices[left]] = EN;
    for (let right = i + 1; right < indices.length && state.resolvedTypes[indices[right]] === ET; right++) state.resolvedTypes[indices[right]] = EN;
  }

  // W6: remaining separators and terminators become ON.
  for (const position of indices) {
    const type = state.resolvedTypes[position];
    if (type === ES || type === ET || type === CS) state.resolvedTypes[position] = ON;
  }

  // W7: EN following an L strong type becomes L.
  let previous = sequence.sos === 1 ? R : L;
  for (const position of indices) {
    const type = state.resolvedTypes[position];
    if (type === EN && previous === L) state.resolvedTypes[position] = L;
    const resolved = state.resolvedTypes[position];
    if (resolved === L || resolved === R) previous = resolved;
  }
}
