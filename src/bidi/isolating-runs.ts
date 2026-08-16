import type { ExplicitState } from "./explicit.js";
import { buildActiveLinks, type ActiveLinks } from "./active.js";

const LRI = 19;
const RLI = 20;
const FSI = 21;

export interface IsolatingRunSequence {
  indices: Uint32Array;
  level: number;
  sos: 0 | 1;
  eos: 0 | 1;
}

/**
 * Build the active level runs used by W/N processing. The sequence links are
 * kept explicit so later phases can add the isolate-boundary transitions from
 * BD13 without reimplementing active-position traversal.
 */
export function buildIsolatingRunSequences(state: ExplicitState, links = buildActiveLinks(state)): IsolatingRunSequence[] {
  const runs: number[][] = [];
  const visited = new Uint8Array(state.types.length);
  for (const start of links.indices) {
    if (visited[start]) continue;
    const run: number[] = [];
    let position = start;
    const level = state.levels[position];
    while (position >= 0 && !visited[position] && state.levels[position] === level) {
      visited[position] = 1;
      run.push(position);
      position = links.next[position];
    }
    runs.push(run);
  }
  const runOf = new Int32Array(state.types.length).fill(-1);
  runs.forEach((run, index) => run.forEach((position) => { runOf[position] = index; }));
  const link = new Int32Array(runs.length).fill(-1);
  const linkedTarget = new Uint8Array(runs.length);
  for (let index = 0; index < runs.length; index++) {
    const last = runs[index][runs[index].length - 1];
    const type = state.types[last];
    if (type !== LRI && type !== RLI && type !== FSI) continue;
    const pdi = state.matchingPdi[last];
    if (pdi < 0) continue;
    // BD13 links to the level run containing the matching PDI. That run may
    // continue beyond the PDI; linking to the run after it skips required
    // context for W/N processing.
    const target = runOf[pdi];
    if (target >= 0 && target !== index) {
      link[index] = target;
      linkedTarget[target] = 1;
    }
  }
  const sequences: IsolatingRunSequence[] = [];
  for (let start = 0; start < runs.length; start++) {
    if (linkedTarget[start]) continue;
    const indices: number[] = [];
    const seen = new Uint8Array(runs.length);
    let current = start;
    while (current >= 0 && !seen[current]) {
      seen[current] = 1;
      indices.push(...runs[current]);
      current = link[current];
    }
    const first = indices[0];
    const last = indices[indices.length - 1];
    const level = state.levels[first];

    // X10: compare against the nearest character on either side that X9 did
    // not remove, falling back to the paragraph embedding level at the
    // paragraph edges. sos/eos take the *higher* of the two levels.
    let before = first - 1;
    while (before >= 0 && state.removed[before]) before--;
    const previousLevel = before >= 0 ? state.levels[before] : state.level;

    const lastType = state.types[last];
    const endsWithUnmatchedIsolate =
      (lastType === LRI || lastType === RLI || lastType === FSI) && state.matchingPdi[last] < 0;
    let after = last + 1;
    while (after < state.levels.length && state.removed[after]) after++;
    const nextLevel =
      endsWithUnmatchedIsolate || after >= state.levels.length ? state.level : state.levels[after];

    sequences.push({
      indices: Uint32Array.from(indices),
      level,
      sos: (Math.max(level, previousLevel) & 1) as 0 | 1,
      eos: (Math.max(level, nextLevel) & 1) as 0 | 1,
    });
  }
  return sequences;
}
