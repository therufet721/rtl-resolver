import { brotliCompressSync, deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { analyzeFontCoverage, analyzeShapingRequirements, arabicJoiningFont, ARABIC_MEEM, ARABIC_MEEM_PAIR, encodeEmptyTransformedGlyf, GLYPH, harfbuzzVersion, listTransformedWoff2Tables, readSfntTables, shapeWithHarfbuzz } from "@rtl-resolver/fonts";

function arabicCmapFont(): Uint8Array {
  const bytes = new Uint8Array(80);
  const view = new DataView(bytes.buffer);
  view.setUint16(4, 1);
  bytes.set([0x63, 0x6d, 0x61, 0x70], 12);
  view.setUint32(20, 28);
  view.setUint32(24, 52);
  view.setUint16(28, 0);
  view.setUint16(30, 1);
  view.setUint16(32, 3);
  view.setUint16(34, 10);
  view.setUint32(36, 12);
  view.setUint16(40, 12);
  view.setUint32(44, 28);
  view.setUint32(52, 1);
  view.setUint32(56, 0x600);
  view.setUint32(60, 0x6ff);
  return bytes;
}

function writeUIntBase128(value: number): number[] {
  if (value === 0) return [0];
  const parts: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    parts.unshift(remaining & 0x7f);
    remaining >>= 7;
  }
  return parts.map((part, index) => (index === parts.length - 1 ? part : part | 0x80));
}

function wrapWoff(sfnt: Uint8Array, compress: boolean): Uint8Array {
  const parsed = readSfntTables(sfnt);
  if (!parsed) throw new Error("invalid sfnt");
  const payloads = parsed.tables.map((table) => {
    const compressed = compress ? new Uint8Array(deflateSync(table.data)) : table.data;
    const body = compress && compressed.byteLength < table.data.byteLength ? compressed : table.data;
    return { table, body };
  });
  let offset = 44 + payloads.length * 20;
  const placed = payloads.map((payload) => {
    offset = Math.ceil(offset / 4) * 4;
    const start = offset;
    offset += payload.body.byteLength;
    return { ...payload, start };
  });
  const bytes = new Uint8Array(Math.ceil(offset / 4) * 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x774f4646);
  view.setUint32(4, parsed.flavor);
  view.setUint32(8, bytes.byteLength);
  view.setUint16(12, parsed.tables.length);
  view.setUint32(16, sfnt.byteLength);
  placed.forEach((payload, index) => {
    const record = 44 + index * 20;
    const tag = payload.table.tag.padEnd(4, " ").slice(0, 4);
    for (let i = 0; i < 4; i++) view.setUint8(record + i, tag.charCodeAt(i));
    view.setUint32(record + 4, payload.start);
    view.setUint32(record + 8, payload.body.byteLength);
    view.setUint32(record + 12, payload.table.data.byteLength);
    view.setUint32(record + 16, payload.table.checksum);
    bytes.set(payload.body, payload.start);
  });
  return bytes;
}

function wrapWoff2(sfnt: Uint8Array): Uint8Array {
  const parsed = readSfntTables(sfnt);
  if (!parsed) throw new Error("invalid sfnt");
  const concatenated = Buffer.concat(parsed.tables.map((table) => Buffer.from(table.data)));
  const compressed = brotliCompressSync(concatenated);
  const directory: number[] = [];
  for (const table of parsed.tables) {
    directory.push(63);
    for (const character of table.tag.padEnd(4, " ").slice(0, 4)) directory.push(character.charCodeAt(0));
    directory.push(...writeUIntBase128(table.data.byteLength));
  }
  const total = 48 + directory.length + compressed.byteLength;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x774f4632);
  view.setUint32(4, parsed.flavor);
  view.setUint32(8, total);
  view.setUint16(12, parsed.tables.length);
  view.setUint32(16, sfnt.byteLength);
  view.setUint32(20, compressed.byteLength);
  bytes.set(directory, 48);
  bytes.set(compressed, 48 + directory.length);
  return bytes;
}

describe("WOFF and WOFF2 cmap coverage", () => {
  const sfnt = arabicCmapFont();

  it("reads uncompressed and zlib-compressed WOFF containers", () => {
    const uncompressed = wrapWoff(sfnt, false);
    const compressed = wrapWoff(sfnt, true);
    expect(analyzeFontCoverage(uncompressed)).toMatchObject({ format: "woff", marks: { arabic: "yes" } });
    expect(analyzeFontCoverage(compressed).scripts).toContain("arabic");
    expect(analyzeFontCoverage(compressed).format).toBe("woff");
  });

  it("reads WOFF2 containers", () => {
    const woff2 = wrapWoff2(sfnt);
    expect(analyzeFontCoverage(woff2)).toMatchObject({ format: "woff2" });
    expect(analyzeFontCoverage(woff2).scripts).toContain("arabic");
  });

  it("returns unknown for truncated binaries", () => {
    expect(analyzeFontCoverage(new Uint8Array([0x77, 0x4f, 0x46, 0x46]))).toMatchObject({ format: "unknown" });
  });

  it("records cmap-only shaping until GSUB/GPOS tables exist", () => {
    expect(analyzeFontCoverage(sfnt)).toMatchObject({
      layoutTables: { gsub: false, gpos: false, gdef: false },
      shaping: "cmap-only",
      transformedTables: [],
    });
  });

  it("lists WOFF2 directory transform flags without claiming a decode", () => {
    const directory = [0x7f, 0x63, 0x6d, 0x61, 0x70, ...writeUIntBase128(10), ...writeUIntBase128(4)];
    const bytes = new Uint8Array(48 + directory.length);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x774f4632);
    view.setUint16(12, 1);
    bytes.set(directory, 48);
    expect(listTransformedWoff2Tables(bytes)).toEqual(["cmap"]);
    expect(listTransformedWoff2Tables(sfnt)).toEqual([]);
  });

  it("reconstructs transformed WOFF2 glyf/loca for empty glyphs", () => {
    const glyf = encodeEmptyTransformedGlyf(2);
    const locaOrig = 6;
    const cmap = readSfntTables(sfnt)?.tables.find((table) => table.tag.trim() === "cmap");
    if (!cmap) throw new Error("cmap");
    const directory: number[] = [];
    directory.push(63);
    for (const character of "cmap") directory.push(character.charCodeAt(0));
    directory.push(...writeUIntBase128(cmap.data.byteLength));
    directory.push(10);
    directory.push(...writeUIntBase128(0), ...writeUIntBase128(glyf.byteLength));
    directory.push(11);
    directory.push(...writeUIntBase128(locaOrig), ...writeUIntBase128(0));
    const body = Buffer.concat([Buffer.from(cmap.data), Buffer.from(glyf)]);
    const compressed = brotliCompressSync(body);
    const total = 48 + directory.length + compressed.byteLength;
    const bytes = new Uint8Array(total);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x774f4632);
    view.setUint32(4, 0x00010000);
    view.setUint32(8, total);
    view.setUint16(12, 3);
    view.setUint32(16, 1);
    view.setUint32(20, compressed.byteLength);
    bytes.set(directory, 48);
    bytes.set(compressed, 48 + directory.length);
    expect(listTransformedWoff2Tables(bytes)).toEqual(["glyf", "loca"]);
    const coverage = analyzeFontCoverage(bytes);
    expect(coverage.format).toBe("woff2");
    expect(coverage.scripts).toContain("arabic");
    expect(coverage.transformedTables).toEqual(["glyf", "loca"]);
    expect(coverage.layoutTables.gsub).toBe(false);
  });

  it("shapes Arabic joining with a GSUB init/medi/fina font", async () => {
    const font = arabicJoiningFont();
    expect(analyzeFontCoverage(font)).toMatchObject({ layoutTables: { gsub: true }, shaping: "tables-present" });
    const isolated = await shapeWithHarfbuzz(font, ARABIC_MEEM, { direction: "rtl", script: "arab", language: "ar" });
    const pair = await shapeWithHarfbuzz(font, ARABIC_MEEM_PAIR, { direction: "rtl", script: "arab", language: "ar" });
    expect(isolated.gsubFeatures.some((tag) => /init|medi|fina|isol/i.test(tag))).toBe(true);
    expect(pair.joined).toBe(true);
    expect(isolated.glyphs[0]?.glyphId).toBe(GLYPH.isol);
    // HarfBuzz returns RTL visual order (fina, then init) rather than logical order.
    expect(new Set(pair.glyphs.map((glyph) => glyph.glyphId))).toEqual(new Set([GLYPH.init, GLYPH.fina]));
    expect(pair.glyphs[0]?.glyphId).not.toBe(pair.glyphs[1]?.glyphId);
  });

  it("marks joining scripts as cmap-insufficient without running a shaper", () => {
    expect(analyzeShapingRequirements("مرحبا")).toMatchObject({ joining: true, cmapOnlyInsufficient: true });
    expect(analyzeShapingRequirements("hello")).toMatchObject({ joining: false, cmapOnlyInsufficient: false });
  });

  it("shapes text with HarfBuzz WASM", async () => {
    expect(await harfbuzzVersion()).toMatch(/^\d+\.\d+/);
    const shaped = await shapeWithHarfbuzz(sfnt, "مرحبا", { direction: "rtl", language: "ar" });
    expect(shaped.engine).toBe("harfbuzz");
    expect(shaped.glyphs.length).toBeGreaterThan(0);
    expect(shaped.joined).toBe(false);
    expect(shaped.note).toMatch(/HarfBuzz/);
  });
});
