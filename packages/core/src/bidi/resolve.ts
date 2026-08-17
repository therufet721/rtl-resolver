import { decodeCodePoints } from "./codepoints.js";
import { resolveParagraphs } from "./paragraphs.js";
import { resolveExplicit } from "./explicit.js";
import { buildIsolatingRunSequences } from "./isolating-runs.js";
import { resolveWeakTypes } from "./weak.js";
import { resolveBrackets } from "./brackets.js";
import { resolveNeutrals } from "./neutral.js";
import { resolveImplicitLevels } from "./implicit.js";
import { applyL1 } from "./lines.js";
import { reorderLine } from "./reorder.js";
import { chooseFastPath } from "./scan.js";

export interface ResolveBidiOptions {
  baseDirection?: "ltr" | "rtl" | "auto";
  /** Document-global UTF-16 offsets strictly inside paragraphs. */
  lineEnds?: readonly number[];
  /**
   * Apply L3, keeping combining marks beside their base character instead of
   * letting L2 reverse the two. L3 is a display-level tailoring, so it is off
   * by default and the reordering matches the UAX #9 reference output.
   */
  applyL3?: boolean;
}

export interface BidiParagraphLevels {
  codePointStart: number;
  codePointEnd: number;
  utf16Start: number;
  utf16End: number;
  baseLevel: 0 | 1;
  levels: Uint8Array;
}

export interface BidiLineAnalysis {
  codePointStart: number;
  codePointEnd: number;
  utf16Start: number;
  utf16End: number;
  visualToLogical: Uint32Array;
  logicalToVisual: Int32Array;
  logicalRuns: readonly BidiRun[];
  visualRuns: readonly BidiRun[];
}

export interface BidiRun {
  codePointStart: number;
  codePointEnd: number;
  utf16Start: number;
  utf16End: number;
  visualIndex: number;
  level: number;
  direction: "ltr" | "rtl";
}

export interface BidiParagraphAnalysis extends BidiParagraphLevels {
  lines: readonly BidiLineAnalysis[];
}

export interface BidiResult<T> {
  text: string;
  paragraphs: readonly T[];
}

function resolveStates(text: string, options: ResolveBidiOptions = {}) {
  const buffer = decodeCodePoints(text);
  const paragraphs = resolveParagraphs(buffer, options.baseDirection ?? "auto");
  const lineEnds = options.lineEnds ?? [];
  const codePointAtUtf16End = new Map<number, number>();
  buffer.utf16Ends.forEach((offset, index) => codePointAtUtf16End.set(offset, index + 1));
  for (let i = 1; i < lineEnds.length; i++) if (lineEnds[i] <= lineEnds[i - 1]) throw new RangeError("lineEnds must be strictly increasing");
  for (const utf16End of lineEnds) {
    const codePointEnd = codePointAtUtf16End.get(utf16End);
    if (codePointEnd === undefined || !paragraphs.some((paragraph) => codePointEnd > paragraph.start && codePointEnd < paragraph.end)) {
      throw new RangeError(`lineEnds offset ${utf16End} must be a code-point boundary strictly inside a paragraph`);
    }
  }
  const states = paragraphs.map((paragraph) => {
    const state = resolveExplicit(paragraph);
    for (const sequence of buildIsolatingRunSequences(state)) {
      resolveWeakTypes(state, sequence);
      resolveBrackets(state, sequence);
      resolveNeutrals(state, sequence);
      resolveImplicitLevels(state, sequence);
    }
    const boundaries = [paragraph.start];
    for (const utf16End of lineEnds) {
      const codePointEnd = codePointAtUtf16End.get(utf16End);
      if (codePointEnd === undefined || codePointEnd <= paragraph.start || codePointEnd >= paragraph.end) continue;
      boundaries.push(codePointEnd);
    }
    boundaries.push(paragraph.end);
    const lines = boundaries.slice(0, -1).map((start, index) => ({ start: start - paragraph.start, end: boundaries[index + 1] - paragraph.start }));
    for (const line of lines) applyL1(state, line.start, line.end);
    return { state, buffer, lines };
  });
  return { buffer, states };
}

function buildRuns(state: ReturnType<typeof resolveExplicit>, start: number, end: number, order: Uint32Array, buffer: ReturnType<typeof decodeCodePoints>): BidiRun[] {
  const visualPositions = new Map<number, number>();
  order.forEach((position, index) => visualPositions.set(position, index));
  const runs: BidiRun[] = [];
  let runStart = -1;
  let runLevel = -1;
  const flush = (runEnd: number) => {
    if (runStart < 0) return;
    let visualIndex = Number.MAX_SAFE_INTEGER;
    for (let i = runStart; i < runEnd; i++) {
      const visual = visualPositions.get(i);
      if (visual !== undefined && visual < visualIndex) visualIndex = visual;
    }
    const globalStart = state.start + runStart;
    const globalEnd = state.start + runEnd;
    runs.push({
      codePointStart: globalStart,
      codePointEnd: globalEnd,
      utf16Start: buffer.utf16Starts[globalStart] ?? 0,
      utf16End: buffer.utf16Ends[globalEnd - 1] ?? 0,
      visualIndex,
      level: runLevel,
      direction: runLevel & 1 ? "rtl" : "ltr",
    });
    runStart = -1;
  };
  for (let position = start; position < end; position++) {
    if (state.removed[position]) { flush(position); continue; }
    if (runStart < 0) { runStart = position; runLevel = state.levels[position]; continue; }
    if (state.levels[position] !== runLevel) { flush(position); runStart = position; runLevel = state.levels[position]; }
  }
  flush(end);
  return runs;
}

/**
 * The fast path may only stand in for the full pipeline when the base
 * direction is not forced RTL, no soft line breaks are supplied, and the text
 * is plain ASCII. See scan.ts for why that input is always level 0.
 */
function usesFastPath(text: string, options?: ResolveBidiOptions) {
  const buffer = decodeCodePoints(text);
  const eligible =
    (options?.baseDirection ?? "auto") !== "rtl" &&
    !options?.lineEnds?.length &&
    chooseFastPath(buffer.flags, buffer.codePoints.length) === "ascii-ltr";
  return { buffer, eligible };
}

export function resolveBidiLevels(text: string, options?: ResolveBidiOptions): BidiResult<BidiParagraphLevels> {
  const { buffer: fastBuffer, eligible } = usesFastPath(text, options);
  if (eligible) {
    return { text, paragraphs: [{
      codePointStart: 0,
      codePointEnd: fastBuffer.codePoints.length,
      utf16Start: 0,
      utf16End: text.length,
      baseLevel: 0,
      levels: new Uint8Array(fastBuffer.codePoints.length),
    }] };
  }
  return resolveBidiLevelsFull(text, options);
}

/** The full pipeline with no fast path. Exported for property tests. */
export function resolveBidiLevelsFull(text: string, options?: ResolveBidiOptions): BidiResult<BidiParagraphLevels> {
  const { buffer, states } = resolveStates(text, options);
  return {
    text,
    paragraphs: states.map(({ state }) => ({
      codePointStart: state.start,
      codePointEnd: state.end,
      utf16Start: buffer.utf16Starts[state.start] ?? 0,
      utf16End: state.end ? buffer.utf16Ends[state.end - 1] : 0,
      baseLevel: state.level,
      levels: state.levels,
    })),
  };
}

export function analyzeBidi(text: string, options?: ResolveBidiOptions): BidiResult<BidiParagraphAnalysis> {
  const { buffer: fastBuffer, eligible } = usesFastPath(text, options);
  if (eligible) {
    const count = fastBuffer.codePoints.length;
    const order = Uint32Array.from({ length: count }, (_, index) => index);
    const inverse = Int32Array.from({ length: count }, (_, index) => index);
    return { text, paragraphs: [{
      codePointStart: 0, codePointEnd: count, utf16Start: 0, utf16End: text.length,
      baseLevel: 0, levels: new Uint8Array(count),
      lines: [{ codePointStart: 0, codePointEnd: count, utf16Start: 0, utf16End: text.length,
        visualToLogical: order, logicalToVisual: inverse,
        logicalRuns: count ? [{ codePointStart: 0, codePointEnd: count, utf16Start: 0, utf16End: text.length, visualIndex: 0, level: 0, direction: "ltr" }] : [],
        visualRuns: count ? [{ codePointStart: 0, codePointEnd: count, utf16Start: 0, utf16End: text.length, visualIndex: 0, level: 0, direction: "ltr" }] : [] }],
    }] };
  }
  return analyzeBidiFull(text, options);
}

/** The full pipeline with no fast path. Exported for property tests. */
export function analyzeBidiFull(text: string, options?: ResolveBidiOptions): BidiResult<BidiParagraphAnalysis> {
  const { buffer, states } = resolveStates(text, options);
  return {
    text,
    paragraphs: states.map(({ state, lines: stateLines }) => {
      const lines: BidiLineAnalysis[] = stateLines.map(({ start, end }) => {
        const reordered = reorderLine(state, start, end, { applyL3: options?.applyL3 });
        const globalStart = state.start + start;
        const globalEnd = state.start + end;
        const logicalRuns = buildRuns(state, start, end, reordered.order, buffer);
        return {
          codePointStart: globalStart,
          codePointEnd: globalEnd,
          utf16Start: buffer.utf16Starts[globalStart] ?? 0,
          utf16End: globalEnd ? buffer.utf16Ends[globalEnd - 1] : 0,
          visualToLogical: Uint32Array.from(reordered.order, (position) => position - start),
          logicalToVisual: Int32Array.from(reordered.logicalToVisual.slice(start, end)),
          logicalRuns,
          visualRuns: [...logicalRuns].sort((a, b) => a.visualIndex - b.visualIndex),
        };
      });
      return {
        codePointStart: state.start,
        codePointEnd: state.end,
        utf16Start: buffer.utf16Starts[state.start] ?? 0,
        utf16End: state.end ? buffer.utf16Ends[state.end - 1] : 0,
        baseLevel: state.level,
        levels: state.levels,
        lines,
      };
    }),
  };
}

export function reorderBidi(text: string, options?: ResolveBidiOptions): string {
  const { buffer, states } = resolveStates(text, options);
  return states.flatMap(({ state, lines }) => lines.map(({ start, end }) => {
    const order = reorderLine(state, start, end, { applyL3: options?.applyL3 }).order;
    return Array.from(order, (position) => String.fromCodePoint(state.codePoints[position])).join("");
  })).join("");
}
