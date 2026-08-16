import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analyzeBidi } from "../../src/bidi/resolve.js";

interface SmokeFixture {
  source: { file: string; unicodeVersion: string; sha256: string; selection: string };
  cases: Array<{
    sourceLine: number;
    codePoints: string;
    direction: "ltr" | "rtl" | "auto";
    paragraphLevel: number;
    levels: Array<number | null>;
    order: number[];
  }>;
}

const fixture = JSON.parse(
  readFileSync(new URL("./conformance-smoke.json", import.meta.url), "utf8")
) as SmokeFixture;

describe(`offline UAX #9 conformance fixture (${fixture.source.file} ${fixture.source.unicodeVersion})`, () => {
  it("carries the provenance needed to regenerate it", () => {
    expect(fixture.source.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(fixture.source.selection).toBeTruthy();
    expect(fixture.cases.length).toBeGreaterThan(100);
  });

  it("resolves every selected official case", () => {
    const failures: string[] = [];
    for (const testCase of fixture.cases) {
      const text = String.fromCodePoint(...testCase.codePoints.split(/\s+/).map((value) => parseInt(value, 16)));
      const paragraph = analyzeBidi(text, { baseDirection: testCase.direction }).paragraphs[0];
      const levels = [...paragraph.levels];
      const order = [...paragraph.lines[0].visualToLogical];

      if (paragraph.baseLevel !== testCase.paragraphLevel) {
        failures.push(`line ${testCase.sourceLine}: paragraph level ${paragraph.baseLevel} != ${testCase.paragraphLevel}`);
        continue;
      }
      // Characters removed by X9 have no resolved level, so they are recorded
      // as null and skipped here, exactly as the official runner skips "x".
      const levelMismatch = testCase.levels.some((value, index) => value !== null && value !== levels[index]);
      if (levelMismatch) {
        failures.push(`line ${testCase.sourceLine}: levels ${levels.join(" ")} != ${testCase.levels.join(" ")}`);
        continue;
      }
      const orderMismatch =
        order.length !== testCase.order.length || testCase.order.some((value, index) => value !== order[index]);
      if (orderMismatch) {
        failures.push(`line ${testCase.sourceLine}: order ${order.join(" ")} != ${testCase.order.join(" ")}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
