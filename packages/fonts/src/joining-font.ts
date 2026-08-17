import { buildSfnt, type SfntTable } from "./woff.js";

function u16(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function tag(value: string): Uint8Array {
  const bytes = new Uint8Array(4);
  const padded = value.padEnd(4, " ").slice(0, 4);
  for (let index = 0; index < 4; index++) bytes[index] = padded.charCodeAt(index);
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

function table(tagName: string, data: Uint8Array): SfntTable {
  return { tag: tagName, checksum: 0, data };
}

function cmap(): Uint8Array {
  // Format 12 maps U+0645 ARABIC LETTER MEEM to glyph 1 (isolated).
  const groups = concat(u32(0x0645), u32(0x0645), u32(1));
  const format12 = concat(u16(12), u16(0), u32(16 + groups.byteLength), u32(0), u32(1), groups);
  const encoding = concat(u16(3), u16(10), u32(12));
  return concat(u16(0), u16(1), encoding, format12);
}

function maxp(): Uint8Array {
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(4, 5);
  return bytes;
}

function head(): Uint8Array {
  const bytes = new Uint8Array(54);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(18, 16);
  view.setInt16(50, 0);
  view.setInt16(52, 0);
  return bytes;
}

function hhea(): Uint8Array {
  const bytes = new Uint8Array(36);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(34, 5);
  return bytes;
}

function hmtx(): Uint8Array {
  const bytes = new Uint8Array(20);
  const view = new DataView(bytes.buffer);
  for (let glyph = 0; glyph < 5; glyph++) view.setUint16(glyph * 4, 500);
  return bytes;
}

function loca(): Uint8Array {
  return new Uint8Array(12);
}

function glyf(): Uint8Array {
  return new Uint8Array(0);
}

function nameTable(): Uint8Array {
  const text = "rtl-resolver joining";
  const encoded = Uint8Array.from(text, (character) => character.charCodeAt(0));
  const record = concat(u16(1), u16(0), u16(0), u16(1), u16(encoded.byteLength), u16(0));
  return concat(u16(0), u16(1), u16(6 + 12), record, encoded);
}

function post(): Uint8Array {
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x00030000);
  return bytes;
}

function coverage(glyph: number): Uint8Array {
  return concat(u16(1), u16(1), u16(glyph));
}

function singleSubst(from: number, to: number): Uint8Array {
  return concat(u16(2), u16(8), u16(1), u16(to), coverage(from));
}

function lookup(from: number, to: number): Uint8Array {
  const subst = singleSubst(from, to);
  return concat(u16(1), u16(0), u16(1), u16(8), subst);
}

function gsub(): Uint8Array {
  // Glyph 1 = isol, 2 = init, 3 = medi, 4 = fina. cmap points at isol.
  const lookups = [lookup(1, 1), lookup(1, 2), lookup(1, 3), lookup(1, 4)];
  const lookupOffsets = [];
  let lookupCursor = 2 + lookups.length * 2;
  for (const body of lookups) {
    lookupOffsets.push(lookupCursor);
    lookupCursor += body.byteLength;
  }
  const lookupList = concat(u16(lookups.length), ...lookupOffsets.map(u16), ...lookups);

  const featureBodies = [0, 1, 2, 3].map((index) => concat(u16(0), u16(1), u16(index)));
  const featureTags = ["isol", "init", "medi", "fina"];
  let featureCursor = 2 + featureTags.length * 6;
  const featureRecords: Uint8Array[] = [];
  for (const body of featureBodies) {
    featureRecords.push(concat(tag(featureTags[featureRecords.length] ?? "isol"), u16(featureCursor)));
    featureCursor += body.byteLength;
  }
  const featureList = concat(u16(featureTags.length), ...featureRecords, ...featureBodies);

  const langSys = concat(u16(0), u16(0xffff), u16(4), u16(0), u16(1), u16(2), u16(3));
  const script = concat(u16(4), u16(0), langSys);
  const scriptList = concat(u16(1), tag("arab"), u16(8), script);

  const headerSize = 10;
  const scriptOffset = headerSize;
  const featureOffset = scriptOffset + scriptList.byteLength;
  const lookupOffset = featureOffset + featureList.byteLength;
  return concat(u32(0x00010000), u16(scriptOffset), u16(featureOffset), u16(lookupOffset), scriptList, featureList, lookupList);
}

/**
 * Minimal Arabic meem font: isol/init/medi/fina GSUB lookups.
 * Used to prove HarfBuzz joining, not as a production typeface.
 */
export function arabicJoiningFont(): Uint8Array {
  return buildSfnt(0x00010000, [
    table("cmap", cmap()),
    table("head", head()),
    table("hhea", hhea()),
    table("hmtx", hmtx()),
    table("maxp", maxp()),
    table("name", nameTable()),
    table("post", post()),
    table("loca", loca()),
    table("glyf", glyf()),
    table("GSUB", gsub()),
  ]);
}

export const ARABIC_MEEM = "\u0645";
export const ARABIC_MEEM_PAIR = "\u0645\u0645";
export const GLYPH = { isol: 1, init: 2, medi: 3, fina: 4 } as const;
