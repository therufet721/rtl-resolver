import type { ExplicitState } from "./explicit.js";

const NSM = 8;
const MAX_DEPTH = 125;

export interface ReorderedLine {
  order: Uint32Array;
  logicalToVisual: Int32Array;
}

export interface ReorderOptions {
  /**
   * Apply L3: keep a combining mark next to its base character instead of
   * letting L2 reverse the two. L3 is a display-level tailoring, so it is off
   * by default and the reordering matches the UAX #9 reference output.
   */
  applyL3?: boolean;
}

/** Apply L2 to one line, excluding X9-removed positions from visual output. */
export function reorderLine(
  state: ExplicitState,
  start = 0,
  end = state.types.length,
  options: ReorderOptions = {}
): ReorderedLine {
  // Each atom is one visual unit. Without L3 that is a single position; with
  // L3 a base character carries its trailing combining marks.
  const atoms: number[][] = [];
  for (let position = start; position < end; position++) {
    if (state.removed[position]) continue;
    if (options.applyL3 && state.types[position] === NSM && atoms.length) atoms[atoms.length - 1].push(position);
    else atoms.push([position]);
  }

  let highest = 0;
  let lowestOdd = MAX_DEPTH + 1;
  for (const atom of atoms) {
    const level = state.levels[atom[0]];
    if (level > highest) highest = level;
    if (level & 1 && level < lowestOdd) lowestOdd = level;
  }

  // L2 reverses down to the lowest odd level present in the line. If no odd
  // level exists, the visual order is already the logical order.
  for (let level = highest; level >= lowestOdd; level--) {
    let i = 0;
    while (i < atoms.length) {
      if (state.levels[atoms[i][0]] < level) {
        i++;
        continue;
      }
      const runStart = i;
      while (i < atoms.length && state.levels[atoms[i][0]] >= level) i++;
      for (let left = runStart, right = i - 1; left < right; left++, right--) {
        const value = atoms[left];
        atoms[left] = atoms[right];
        atoms[right] = value;
      }
    }
  }

  const order = Uint32Array.from(atoms.flat());
  const logicalToVisual = new Int32Array(state.types.length).fill(-1);
  order.forEach((position, visual) => {
    logicalToVisual[position] = visual;
  });
  return { order, logicalToVisual };
}
