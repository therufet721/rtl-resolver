import { detectScript as detectCoreScript, type ScriptName } from "@rtl-resolver/core";
import { identifyFontContainer, listTransformedWoff2Tables, readSfntTables, unwrapToSfnt, type FontContainer } from "./woff.js";

export type { FontContainer } from "./woff.js";
export { identifyFontContainer, listTransformedWoff2Tables, readSfntTables, buildSfnt, encodeEmptyTransformedGlyf } from "./woff.js";
export { arabicJoiningFont, ARABIC_MEEM, ARABIC_MEEM_PAIR, GLYPH } from "./joining-font.js";
export { harfbuzzVersion, shapeWithHarfbuzz, type ShapeResult, type ShapedGlyph } from "./harfbuzz.js";

export type Script = ScriptName;
export type CoverageMark = "yes" | "partial" | "no";
export interface TypographyRequirements { script: Script; joined: boolean; recommendedLineHeight: number; letterSpacing: "normal"; }

export const detectScript = detectCoreScript;

export function getRecommendedFontStack(script: Script): string {
  if (script === "persian") return "\"Vazirmatn\", \"Noto Sans Arabic\", sans-serif";
  if (script === "urdu") return "\"Noto Nastaliq Urdu\", \"Noto Sans Arabic\", sans-serif";
  if (script === "arabic") return "\"Noto Sans Arabic\", \"Segoe UI\", sans-serif";
  if (script === "hebrew") return "\"Noto Sans Hebrew\", \"Arial Hebrew\", sans-serif";
  if (script === "latin") return "Inter, system-ui, sans-serif";
  return "system-ui, sans-serif";
}

export function getTypographyRequirements(script: Script): TypographyRequirements {
  return {
    script,
    joined: script === "arabic" || script === "persian" || script === "urdu",
    recommendedLineHeight: script === "arabic" || script === "persian" || script === "urdu" || script === "hebrew" ? 1.6 : 1.4,
    letterSpacing: "normal",
  };
}

/** Cmap hits and layout-table flags are not shaping, joining, ligature, or font-loading quality. */
export const FONT_LIMITATIONS =
  "Coverage marks come from cmap ranges. shapeWithHarfbuzz() runs HarfBuzz WASM; joining quality requires a font with GSUB init/medi/fina (see arabicJoiningFont()). WOFF2 unwrap reconstructs transformed glyf/loca (empty and simple glyphs) and hmtx; composite glyphs are skipped so cmap coverage can still succeed. Fallback, clipping, and font-loading remain application responsibilities.";

export interface ScriptCoverageReport {
  counts: Record<Script, number>;
  scripts: Script[];
  stacks: Record<Script, string>;
}

export interface FontCoverageReport {
  format: FontContainer;
  codePoints: number;
  scripts: Script[];
  ranges: Array<{ start: number; end: number; script: Script }>;
  marks: Record<Exclude<Script, "unknown">, CoverageMark>;
  layoutTables: { gsub: boolean; gpos: boolean; gdef: boolean };
  shaping: "tables-present" | "cmap-only" | "unknown";
  transformedTables: readonly string[];
}

const DISTINCTIVE: Record<Exclude<Script, "unknown" | "latin" | "hebrew" | "arabic">, number[]> = {
  persian: [0x067e, 0x0686, 0x0698, 0x06af, 0x06cc],
  urdu: [0x0679, 0x0688, 0x0691, 0x06ba, 0x06be, 0x06d2, 0x06f0],
};

const SCRIPT_RANGES: Array<[number, number, Script]> = [
  [0x0590, 0x05ff, "hebrew"],
  [0x0679, 0x0679, "urdu"], [0x067e, 0x067e, "persian"],
  [0x0686, 0x0686, "persian"], [0x0688, 0x0688, "urdu"],
  [0x0691, 0x0691, "urdu"], [0x0698, 0x0698, "persian"],
  [0x06ba, 0x06ba, "urdu"], [0x06be, 0x06be, "urdu"],
  [0x06cc, 0x06cc, "persian"], [0x06d2, 0x06d2, "urdu"],
  [0x06f0, 0x06f9, "urdu"],
  [0x0600, 0x06ff, "arabic"],
  [0x0750, 0x077f, "arabic"],
  [0x08a0, 0x08ff, "arabic"],
  [0x0041, 0x024f, "latin"],
];

function intersects(start: number, end: number, rangeStart: number, rangeEnd: number): boolean {
  return start <= rangeEnd && end >= rangeStart;
}

function coverageMarks(covered: Set<number>, scripts: readonly Script[]): Record<Exclude<Script, "unknown">, CoverageMark> {
  const has = (script: Script) => scripts.includes(script);
  const distinctive = (codes: readonly number[]) => codes.some((code) => covered.has(code));
  return {
    latin: has("latin") ? "yes" : "no",
    hebrew: has("hebrew") ? "yes" : "no",
    arabic: has("arabic") ? "yes" : "no",
    persian: distinctive(DISTINCTIVE.persian) ? "yes" : has("arabic") ? "partial" : "no",
    urdu: distinctive(DISTINCTIVE.urdu) ? "yes" : has("arabic") ? "partial" : "no",
  };
}

/** Inspect TrueType/OpenType/WOFF/WOFF2 cmap tables without depending on a shaping engine. */
export function analyzeFontCoverage(input: ArrayBuffer | Uint8Array): FontCoverageReport {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const emptyMarks = { latin: "no", arabic: "no", persian: "no", urdu: "no", hebrew: "no" } as const;
  const empty: FontCoverageReport = {
    format: "unknown", codePoints: 0, scripts: [], ranges: [], marks: { ...emptyMarks },
    layoutTables: { gsub: false, gpos: false, gdef: false }, shaping: "unknown", transformedTables: [],
  };
  const container = identifyFontContainer(bytes);
  let sfnt = bytes;
  try {
    const unwrapped = unwrapToSfnt(bytes);
    if (!unwrapped) return empty;
    sfnt = unwrapped;
  } catch {
    return empty;
  }
  const view = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength);
  if (sfnt.byteLength < 12) return empty;
  const numTables = view.getUint16(4, false);
  let cmapOffset = -1;
  let cmapLength = 0;
  for (let index = 0; index < numTables; index++) {
    const record = 12 + index * 16;
    if (record + 16 > sfnt.byteLength) break;
    const tag = String.fromCharCode(view.getUint8(record), view.getUint8(record + 1), view.getUint8(record + 2), view.getUint8(record + 3));
    if (tag === "cmap") { cmapOffset = view.getUint32(record + 8, false); cmapLength = view.getUint32(record + 12, false); break; }
  }
  if (cmapOffset < 0 || cmapOffset + 4 > sfnt.byteLength) return empty;
  const cmapEnd = Math.min(sfnt.byteLength, cmapOffset + cmapLength);
  const numSubtables = view.getUint16(cmapOffset + 2, false);
  const covered = new Set<number>();
  const addRange = (start: number, end: number) => {
    if (start > end) return;
    const cappedEnd = Math.min(end, start + 4096);
    for (let code = start; code <= cappedEnd; code++) covered.add(code);
  };
  for (let index = 0; index < numSubtables; index++) {
    const record = cmapOffset + 4 + index * 8;
    if (record + 8 > cmapEnd) break;
    const formatOffset = cmapOffset + view.getUint32(record + 4, false);
    if (formatOffset + 2 > cmapEnd) continue;
    const format = view.getUint16(formatOffset, false);
    if (format === 4 && formatOffset + 16 <= cmapEnd) {
      const segCount = view.getUint16(formatOffset + 6, false) / 2;
      const endCodes = formatOffset + 14;
      for (let segment = 0; segment < segCount; segment++) {
        const end = view.getUint16(endCodes + segment * 2, false);
        const start = view.getUint16(endCodes + segCount * 2 + 2 + segment * 2, false);
        if (start !== 0xffff) addRange(start, end);
      }
    } else if (format === 12 && formatOffset + 16 <= cmapEnd) {
      const groups = view.getUint32(formatOffset + 12, false);
      const groupsStart = formatOffset + 16;
      for (let group = 0; group < groups; group++) {
        const offset = groupsStart + group * 12;
        if (offset + 12 > cmapEnd) break;
        addRange(view.getUint32(offset, false), view.getUint32(offset + 4, false));
      }
    }
  }
  const ranges: Array<{ start: number; end: number; script: Script }> = [];
  for (const [rangeStart, rangeEnd, script] of SCRIPT_RANGES) {
    let start = -1;
    for (let code = rangeStart; code <= rangeEnd; code++) {
      if (covered.has(code)) {
        if (start < 0) start = code;
      } else if (start >= 0) {
        ranges.push({ start, end: code - 1, script });
        start = -1;
      }
    }
    if (start >= 0) ranges.push({ start, end: rangeEnd, script });
  }
  const scripts = [...new Set(ranges.map((range) => range.script))];
  const parsed = readSfntTables(sfnt);
  const tags = new Set((parsed?.tables ?? []).map((table) => table.tag.trim()));
  const layoutTables = {
    gsub: tags.has("GSUB"),
    gpos: tags.has("GPOS"),
    gdef: tags.has("GDEF"),
  };
  return {
    format: container === "sfnt" ? "sfnt" : container,
    codePoints: covered.size,
    scripts,
    ranges,
    marks: coverageMarks(covered, scripts),
    layoutTables,
    shaping: layoutTables.gsub || layoutTables.gpos ? "tables-present" : "cmap-only",
    transformedTables: listTransformedWoff2Tables(bytes),
  };
}

export function scriptCoverageMatrix(report: FontCoverageReport): Record<Exclude<Script, "unknown">, CoverageMark> {
  return report.marks;
}

/** Report scripts observed in text; this intentionally does not parse font binaries. */
export function analyzeTextCoverage(text: string): ScriptCoverageReport {
  const counts: Record<Script, number> = { arabic: 0, persian: 0, urdu: 0, hebrew: 0, latin: 0, unknown: 0 };
  for (const char of text) counts[detectScript(char)]++;
  const scripts = (Object.keys(counts) as Script[]).filter((script) => counts[script] > 0);
  return {
    counts,
    scripts,
    stacks: Object.fromEntries(scripts.map((script) => [script, getRecommendedFontStack(script)])) as Record<Script, string>,
  };
}

export interface ShapingRequirements {
  joining: boolean;
  scripts: Script[];
  cmapOnlyInsufficient: boolean;
  note: string;
}

/** Text-side shaping needs. This is not a HarfBuzz/shaper quality report. */
export function analyzeShapingRequirements(text: string): ShapingRequirements {
  const scripts = analyzeTextCoverage(text).scripts;
  const joining = scripts.some((script) => script === "arabic" || script === "persian" || script === "urdu");
  return {
    joining,
    scripts,
    cmapOnlyInsufficient: joining,
    note: joining
      ? "Arabic, Persian, and Urdu need HarfBuzz (shapeWithHarfbuzz) plus a font with joining GSUB features. cmap coverage alone is not shaping quality."
      : "cmap coverage can detect glyph presence. Use shapeWithHarfbuzz() when glyph IDs and advances are required.",
  };
}
