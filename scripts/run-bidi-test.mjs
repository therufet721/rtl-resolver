import fs from "node:fs";
import path from "node:path";
import { analyzeBidi, bidiClassName } from "../dist/bidi/index.js";
import { cacheDir } from "./unicode-source.mjs";

/**
 * BidiTest.txt states its cases as Bidi_Class names rather than code points,
 * so each class needs one representative character. The table is asserted
 * against the generated Bidi_Class data below, which keeps a wrong pick from
 * silently turning into a wrong test.
 */
const REPRESENTATIVE = {
  L: 0x006c, R: 0x05d0, AL: 0x0627, EN: 0x0030, ES: 0x002b, ET: 0x0025,
  AN: 0x0660, CS: 0x002c, NSM: 0x0300, BN: 0x00ad, B: 0x2029, S: 0x0009,
  WS: 0x0020, ON: 0x0021, LRE: 0x202a, RLE: 0x202b, LRO: 0x202d, RLO: 0x202e,
  PDF: 0x202c, LRI: 0x2066, RLI: 0x2067, FSI: 0x2068, PDI: 0x2069,
};
for (const [name, codePoint] of Object.entries(REPRESENTATIVE)) {
  const actual = bidiClassName(codePoint);
  if (actual !== name) {
    throw new Error(`representative U+${codePoint.toString(16).toUpperCase()} for ${name} classifies as ${actual}`);
  }
}

// Bit values of the <bitset> field in a data line.
const DIRECTIONS = [
  [1, "auto"],
  [2, "ltr"],
  [4, "rtl"],
];

const file = process.argv[2] ?? path.join(cacheDir(), "BidiTest.txt");
const limit = Number(process.env.BIDI_LIMIT ?? 0);
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

let levels = [];
let reorder = [];
let tested = 0;
let failures = 0;

for (let lineNumber = 0; lineNumber < lines.length && !(limit && tested >= limit); lineNumber++) {
  const line = lines[lineNumber].split("#")[0].trim();
  if (!line) continue;
  if (line.startsWith("@Levels:")) {
    levels = line.slice("@Levels:".length).trim().split(/\s+/).filter(Boolean);
    continue;
  }
  if (line.startsWith("@Reorder:")) {
    reorder = line.slice("@Reorder:".length).trim().split(/\s+/).filter(Boolean).map(Number);
    continue;
  }
  const [classes, bitsetField] = line.split(";");
  if (bitsetField === undefined) continue;
  const names = classes.trim().split(/\s+/).filter(Boolean);
  const bitset = Number(bitsetField.trim());
  const text = String.fromCodePoint(...names.map((name) => {
    const codePoint = REPRESENTATIVE[name];
    if (codePoint === undefined) throw new Error(`line ${lineNumber + 1}: unknown Bidi_Class ${name}`);
    return codePoint;
  }));

  for (const [bit, direction] of DIRECTIONS) {
    if (!(bitset & bit)) continue;
    if (limit && tested >= limit) break;
    tested++;
    // Cases end with at most one B, so the whole input is a single paragraph.
    const paragraph = analyzeBidi(text, { baseDirection: direction }).paragraphs[0];
    const actualLevels = [...paragraph.levels];
    const actualOrder = [...paragraph.lines[0].visualToLogical];
    const levelMismatch =
      levels.length !== actualLevels.length ||
      levels.some((value, index) => value !== "x" && Number(value) !== actualLevels[index]);
    const orderMismatch =
      reorder.length !== actualOrder.length || reorder.some((value, index) => value !== actualOrder[index]);
    if (!levelMismatch && !orderMismatch) continue;
    failures++;
    if (failures <= 20) {
      console.error(`line ${lineNumber + 1} (${direction}): mismatch`);
      console.error(`  input:  ${names.join(" ")}`);
      console.error(`  levels expected: ${levels.join(" ")}`);
      console.error(`  levels actual:   ${actualLevels.join(" ")}`);
      console.error(`  order expected:  ${reorder.join(" ")}`);
      console.error(`  order actual:    ${actualOrder.join(" ")}`);
    }
  }
}

console.log(`BidiTest: ${tested} cases, ${failures} failures`);
if (failures) process.exitCode = 1;
