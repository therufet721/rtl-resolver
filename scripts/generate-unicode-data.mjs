import fs from "node:fs";
import { manifest, readVerified, resolveOutput } from "./unicode-source.mjs";

const output = resolveOutput("src/bidi/data/bidi.generated.ts", process.argv[3]);
const { text: source } = readVerified("DerivedBidiClass.txt", process.argv[2]);
const version = manifest.unicodeVersion;

const names = new Map([
  ["Left_To_Right", "L"], ["Right_To_Left", "R"], ["Arabic_Letter", "AL"],
  ["European_Number", "EN"], ["European_Separator", "ES"],
  ["European_Terminator", "ET"], ["Arabic_Number", "AN"],
  ["Common_Separator", "CS"], ["Nonspacing_Mark", "NSM"],
  ["Boundary_Neutral", "BN"], ["Paragraph_Separator", "B"],
  ["Segment_Separator", "S"], ["Whitespace", "WS"], ["Other_Neutral", "ON"],
  ["Left_To_Right_Embedding", "LRE"], ["Right_To_Left_Embedding", "RLE"],
  ["Left_To_Right_Override", "LRO"], ["Right_To_Left_Override", "RLO"],
  ["Pop_Directional_Format", "PDF"], ["Left_To_Right_Isolate", "LRI"],
  ["Right_To_Left_Isolate", "RLI"], ["First_Strong_Isolate", "FSI"],
  ["Pop_Directional_Isolate", "PDI"],
]);
const classes = ["L", "R", "AL", "EN", "ES", "ET", "AN", "CS", "NSM", "BN", "B", "S", "WS", "ON", "LRE", "RLE", "LRO", "RLO", "PDF", "LRI", "RLI", "FSI", "PDI"];
const classCode = new Map(classes.map((name, index) => [name, index]));
const values = new Uint8Array(0x110000); // global @missing default is L
const ranges = [];
const parseRange = (value) => {
  const [start, end = start] = value.trim().split("..").map((part) => parseInt(part, 16));
  return [start, end];
};

for (const line of source.split(/\r?\n/)) {
  const missing = line.match(/^# @missing:\s*([^;]+);\s*(\S+)/);
  if (missing) {
    const [start, end] = parseRange(missing[1]);
    const code = classCode.get(names.get(missing[2]) ?? missing[2]);
    if (code === undefined) throw new Error(`Unknown missing class: ${missing[2]}`);
    values.fill(code, start, end + 1);
    continue;
  }
  if (line.startsWith("#") || !line.trim()) continue;
  const match = line.match(/^([0-9A-F.]+)\s*;\s*(\S+)/);
  if (!match) continue;
  const [start, end] = parseRange(match[1]);
  const code = classCode.get(names.get(match[2]) ?? match[2]);
  if (code === undefined) throw new Error(`Unknown class: ${match[2]}`);
  values.fill(code, start, end + 1);
}

const pages = new Map();
const stage1 = new Uint16Array(0x110000 >>> 8);
const stage2 = [];
for (let pageNumber = 0; pageNumber < stage1.length; pageNumber++) {
  const page = Array.from(values.subarray(pageNumber << 8, (pageNumber + 1) << 8));
  const key = page.join(",");
  let pageIndex = pages.get(key);
  if (pageIndex === undefined) {
    pageIndex = stage2.length / 256;
    pages.set(key, pageIndex);
    stage2.push(...page);
  }
  stage1[pageNumber] = pageIndex;
}

const format = (array, width = 16) => {
  const values = Array.from(array, Number);
  const lines = [];
  for (let i = 0; i < values.length; i += width) lines.push(`  ${values.slice(i, i + width).join(", ")}`);
  return lines.join(",\n");
};
const content = `// Generated from DerivedBidiClass.txt for Unicode ${version}. Do not edit manually.\n` +
  `export const UNICODE_VERSION = "${version}" as const;\n` +
  `export const BIDI_CLASS_NAMES = ${JSON.stringify(classes)} as const;\n` +
  `export const BIDI_STAGE_1 = new Uint16Array([\n${format(stage1)}\n]);\n` +
  `export const BIDI_STAGE_2 = new Uint8Array([\n${format(stage2)}\n]);\n`;
fs.mkdirSync(output.substring(0, output.lastIndexOf("/")), { recursive: true });
fs.writeFileSync(output, content);
console.log(`generated ${output}: ${stage1.length} stage-1 entries, ${stage2.length} stage-2 entries, ${pages.size} unique pages`);
