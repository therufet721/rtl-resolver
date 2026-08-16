import fs from "node:fs";
import { analyzeBidi } from "../dist/bidi/index.js";

const file = process.argv[2] ?? ".cache/unicode/17.0.0/BidiCharacterTest.txt";
const limit = Number(process.env.BIDI_LIMIT ?? 0);
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
let tested = 0;
let failures = 0;

for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
  const line = lines[lineNumber].trim();
  if (!line || line.startsWith("#")) continue;
  const fields = line.split(";").map((field) => field.trim());
  if (fields.length !== 5) continue;
  if (limit && tested >= limit) break;
  tested++;
  const codePoints = fields[0].split(/\s+/).map((value) => parseInt(value, 16));
  const text = String.fromCodePoint(...codePoints);
  const direction = fields[1] === "0" ? "ltr" : fields[1] === "1" ? "rtl" : "auto";
  const expectedParagraphLevel = Number(fields[2]);
  const expectedLevels = fields[3].split(/\s+/);
  const expectedOrder = fields[4].split(/\s+/).filter(Boolean).map(Number);
  const paragraph = analyzeBidi(text, { baseDirection: direction }).paragraphs[0];
  const actualLevels = [...paragraph.levels];
  const actualOrder = [...paragraph.lines[0].visualToLogical];
  const levelMismatch = paragraph.baseLevel !== expectedParagraphLevel || expectedLevels.some((value, index) => value !== "x" && Number(value) !== actualLevels[index]);
  const orderMismatch = expectedOrder.some((value, index) => value !== actualOrder[index]);
  if (levelMismatch || orderMismatch) {
    failures++;
    if (failures <= 20) {
      console.error(`line ${lineNumber + 1}: mismatch`);
      console.error(`  input: ${fields[0]}`);
      console.error(`  expected level: ${fields[2]} actual: ${paragraph.baseLevel}`);
      console.error(`  expected levels: ${fields[3]} actual: ${actualLevels.join(" ")}`);
      console.error(`  expected order: ${fields[4]} actual: ${actualOrder.join(" ")}`);
    }
  }
}

console.log(`BidiCharacterTest: ${tested} cases, ${failures} failures`);
if (failures) process.exitCode = 1;
