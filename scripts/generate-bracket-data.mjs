import fs from "node:fs";
import { manifest, readVerified, resolveOutput } from "./unicode-source.mjs";

const { text: bracketSource } = readVerified("BidiBrackets.txt", process.argv[2]);
const { text: mirrorSource } = readVerified("BidiMirroring.txt", process.argv[3]);
const output = resolveOutput("src/bidi/data/bidi-pairs.generated.ts", process.argv[4]);
const brackets = [];
for (const line of bracketSource.split(/\r?\n/)) {
  const match = line.match(/^([0-9A-F]+);\s*([0-9A-F]+);\s*([oc])/);
  if (match && match[3] === "o") brackets.push([parseInt(match[1], 16), parseInt(match[2], 16)]);
}
const mirrors = [];
for (const line of mirrorSource.split(/\r?\n/)) {
  const match = line.match(/^([0-9A-F]+);\s*([0-9A-F]+)/);
  if (match) mirrors.push([parseInt(match[1], 16), parseInt(match[2], 16)]);
}
const pairLines = brackets.map(([open, close]) => `  [0x${open.toString(16)}, 0x${close.toString(16)}]`).join(",\n");
const mirrorLines = mirrors.map(([from, to]) => `  [0x${from.toString(16)}, 0x${to.toString(16)}]`).join(",\n");
const content = `// Generated from Unicode ${manifest.unicodeVersion} BidiBrackets.txt and BidiMirroring.txt.\n` +
  `export const BIDI_BRACKET_PAIRS = [\n${pairLines}\n] as const;\n` +
  `export const BIDI_MIRRORING_PAIRS = [\n${mirrorLines}\n] as const;\n`;
fs.writeFileSync(output, content);
console.log(`generated ${brackets.length} bracket pairs and ${mirrors.length} mirroring pairs`);
