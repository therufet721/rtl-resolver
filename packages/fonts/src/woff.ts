import { brotliDecompress, inflateZlib } from "./inflate.js";
import { encodeEmptyTransformedGlyf, reconstructTransformedGlyf, reconstructTransformedHmtx, tableIsTransformed } from "./woff2-transform.js";

export type FontContainer = "sfnt" | "woff" | "woff2" | "unknown";

export interface SfntTable {
  tag: string;
  checksum: number;
  data: Uint8Array;
}

const WOFF_SIGNATURE = 0x774f4646;
const WOFF2_SIGNATURE = 0x774f4632;

const WOFF2_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf",
  "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT",
  "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT",
  "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar",
  "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd",
  "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
] as const;

export function identifyFontContainer(bytes: Uint8Array): FontContainer {
  if (bytes.byteLength < 4) return "unknown";
  const signature = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
  if (signature === WOFF_SIGNATURE) return "woff";
  if (signature === WOFF2_SIGNATURE) return "woff2";
  return "sfnt";
}

export function unwrapToSfnt(bytes: Uint8Array): Uint8Array | undefined {
  const container = identifyFontContainer(bytes);
  if (container === "woff") return unwrapWoff(bytes);
  if (container === "woff2") return unwrapWoff2(bytes);
  return bytes;
}

export function readSfntTables(bytes: Uint8Array): { flavor: number; tables: SfntTable[] } | undefined {
  if (bytes.byteLength < 12) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(0, false);
  const numTables = view.getUint16(4, false);
  const tables: SfntTable[] = [];
  for (let index = 0; index < numTables; index++) {
    const record = 12 + index * 16;
    if (record + 16 > bytes.byteLength) return undefined;
    const tag = String.fromCharCode(view.getUint8(record), view.getUint8(record + 1), view.getUint8(record + 2), view.getUint8(record + 3));
    const checksum = view.getUint32(record + 4, false);
    const offset = view.getUint32(record + 8, false);
    const length = view.getUint32(record + 12, false);
    if (offset + length > bytes.byteLength) return undefined;
    tables.push({ tag, checksum, data: bytes.subarray(offset, offset + length) });
  }
  return { flavor, tables };
}

export function buildSfnt(flavor: number, tables: readonly SfntTable[]): Uint8Array {
  const numTables = tables.length;
  const headerSize = 12 + numTables * 16;
  let dataSize = 0;
  const padded = tables.map((table) => {
    const padding = (4 - (table.data.byteLength % 4)) % 4;
    dataSize += table.data.byteLength + padding;
    return { table, padding };
  });
  const bytes = new Uint8Array(headerSize + dataSize);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, flavor, false);
  view.setUint16(4, numTables, false);
  const entrySelector = Math.floor(Math.log2(Math.max(1, numTables)));
  const searchRange = 16 * 2 ** entrySelector;
  view.setUint16(6, searchRange, false);
  view.setUint16(8, entrySelector, false);
  view.setUint16(10, numTables * 16 - searchRange, false);
  let offset = headerSize;
  padded.forEach(({ table, padding }, index) => {
    const record = 12 + index * 16;
    const tag = table.tag.padEnd(4, " ").slice(0, 4);
    for (let i = 0; i < 4; i++) view.setUint8(record + i, tag.charCodeAt(i));
    view.setUint32(record + 4, table.checksum, false);
    view.setUint32(record + 8, offset, false);
    view.setUint32(record + 12, table.data.byteLength, false);
    bytes.set(table.data, offset);
    offset += table.data.byteLength + padding;
  });
  return bytes;
}

function unwrapWoff(bytes: Uint8Array): Uint8Array | undefined {
  if (bytes.byteLength < 44) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(4, false);
  const numTables = view.getUint16(12, false);
  const tables: SfntTable[] = [];
  for (let index = 0; index < numTables; index++) {
    const record = 44 + index * 20;
    if (record + 20 > bytes.byteLength) return undefined;
    const tag = String.fromCharCode(view.getUint8(record), view.getUint8(record + 1), view.getUint8(record + 2), view.getUint8(record + 3));
    const offset = view.getUint32(record + 4, false);
    const compLength = view.getUint32(record + 8, false);
    const origLength = view.getUint32(record + 12, false);
    const checksum = view.getUint32(record + 16, false);
    if (offset + compLength > bytes.byteLength) return undefined;
    const compressed = bytes.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateZlib(compressed).subarray(0, origLength) : compressed.subarray(0, origLength);
    tables.push({ tag, checksum, data });
  }
  return buildSfnt(flavor, tables);
}

function readUIntBase128(view: DataView, offset: number): { value: number; offset: number } | undefined {
  let value = 0;
  let cursor = offset;
  for (let index = 0; index < 5; index++) {
    if (cursor >= view.byteLength) return undefined;
    const byte = view.getUint8(cursor);
    cursor++;
    if (index === 0 && byte === 0x80) return undefined;
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, offset: cursor };
  }
  return undefined;
}

function parseWoff2Directory(bytes: Uint8Array): { flavor: number; totalCompressedSize: number; dataStart: number; directory: Array<{ tag: string; origLength: number; streamLength: number; transform: number; transformed: boolean }> } | undefined {
  if (bytes.byteLength < 48) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(4, false);
  const numTables = view.getUint16(12, false);
  const totalCompressedSize = view.getUint32(20, false);
  let cursor = 48;
  const directory: Array<{ tag: string; origLength: number; streamLength: number; transform: number; transformed: boolean }> = [];
  for (let index = 0; index < numTables; index++) {
    if (cursor >= bytes.byteLength) return undefined;
    const flags = view.getUint8(cursor);
    cursor++;
    const tagIndex = flags & 0x3f;
    const transform = flags >> 6;
    let tag: string;
    if (tagIndex === 63) {
      if (cursor + 4 > bytes.byteLength) return undefined;
      tag = String.fromCharCode(view.getUint8(cursor), view.getUint8(cursor + 1), view.getUint8(cursor + 2), view.getUint8(cursor + 3));
      cursor += 4;
    } else {
      tag = WOFF2_TAGS[tagIndex] ?? "    ";
    }
    const orig = readUIntBase128(view, cursor);
    if (!orig) return undefined;
    cursor = orig.offset;
    const transformed = tableIsTransformed(tag, transform);
    let streamLength = orig.value;
    if (transformed) {
      const length = readUIntBase128(view, cursor);
      if (!length) return undefined;
      cursor = length.offset;
      streamLength = length.value;
    }
    directory.push({ tag, origLength: orig.value, streamLength, transform, transformed });
  }
  return { flavor, totalCompressedSize, dataStart: cursor, directory };
}

export function listTransformedWoff2Tables(bytes: Uint8Array): string[] {
  if (identifyFontContainer(bytes) !== "woff2") return [];
  const parsed = parseWoff2Directory(bytes);
  return parsed?.directory.filter((entry) => entry.transformed).map((entry) => entry.tag.trim()) ?? [];
}

function numberOfHMetrics(tables: readonly SfntTable[]): number | undefined {
  const hhea = tables.find((table) => table.tag.trim() === "hhea");
  if (!hhea || hhea.data.byteLength < 36) return undefined;
  return new DataView(hhea.data.buffer, hhea.data.byteOffset, hhea.data.byteLength).getUint16(34, false);
}

function unwrapWoff2(bytes: Uint8Array): Uint8Array | undefined {
  const parsed = parseWoff2Directory(bytes);
  if (!parsed) return undefined;
  if (parsed.dataStart + parsed.totalCompressedSize > bytes.byteLength) return undefined;
  const decompressed = brotliDecompress(bytes.subarray(parsed.dataStart, parsed.dataStart + parsed.totalCompressedSize));
  const tables: SfntTable[] = [];
  let source = 0;
  let reconstructedGlyf: { glyf: Uint8Array; loca: Uint8Array; xMins: number[] } | undefined;
  let hmtxPayload: Uint8Array | undefined;
  for (const entry of parsed.directory) {
    if (source + entry.streamLength > decompressed.byteLength) return undefined;
    const payload = decompressed.subarray(source, source + entry.streamLength);
    source += entry.streamLength;
    const name = entry.tag.trim();
    if (!entry.transformed) {
      tables.push({ tag: entry.tag, checksum: 0, data: payload.subarray(0, Math.min(entry.origLength, payload.byteLength)) });
      continue;
    }
    if (name === "glyf" && entry.transform === 0) {
      reconstructedGlyf = reconstructTransformedGlyf(payload);
      continue;
    }
    if (name === "loca" && entry.transform === 0) continue;
    if (name === "hmtx" && entry.transform === 1) {
      hmtxPayload = payload;
    }
  }
  if (reconstructedGlyf) {
    tables.push({ tag: "glyf", checksum: 0, data: reconstructedGlyf.glyf });
    tables.push({ tag: "loca", checksum: 0, data: reconstructedGlyf.loca });
  }
  if (hmtxPayload) {
    const metrics = numberOfHMetrics(tables);
    const xMins = reconstructedGlyf?.xMins;
    const hmtx = metrics && xMins
      ? reconstructTransformedHmtx(hmtxPayload, xMins.length, metrics, xMins)
      : undefined;
    if (hmtx) tables.push({ tag: "hmtx", checksum: 0, data: hmtx });
  }
  if (!tables.length) return undefined;
  return buildSfnt(parsed.flavor, tables);
}

export { encodeEmptyTransformedGlyf, tableIsTransformed };
