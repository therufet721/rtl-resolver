import type { ExplicitState } from "./explicit.js";

export interface ActiveLinks {
  next: Int32Array;
  previous: Int32Array;
  indices: Uint32Array;
}

/** Build O(1) links between active (non-X9-removed) positions. */
export function buildActiveLinks(state: ExplicitState): ActiveLinks {
  const next = new Int32Array(state.types.length).fill(-1);
  const previous = new Int32Array(state.types.length).fill(-1);
  const active: number[] = [];
  let last = -1;
  for (let i = 0; i < state.types.length; i++) {
    if (state.removed[i]) continue;
    active.push(i);
    previous[i] = last;
    if (last >= 0) next[last] = i;
    last = i;
  }
  return { next, previous, indices: Uint32Array.from(active) };
}
