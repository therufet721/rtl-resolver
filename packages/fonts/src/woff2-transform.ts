/**
 * WOFF2 glyf/loca/hmtx transforms (W3C WOFF2 §§5.1–5.4).
 * Empty glyphs are reconstructed fully. Simple outlines use the triplet
 * decoder; composites are left unreconstructed so cmap-only coverage can
 * still succeed from the remaining tables.
 */

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

function readI16(view: DataView, offset: number): number {
  return view.getInt16(offset, false);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function read255UInt16(bytes: Uint8Array, cursor: { offset: number }): number {
  const first = bytes[cursor.offset++] ?? 0;
  if (first === 253) {
    const value = ((bytes[cursor.offset] ?? 0) << 8) | (bytes[cursor.offset + 1] ?? 0);
    cursor.offset += 2;
    return value;
  }
  if (first === 254) {
    const value = ((bytes[cursor.offset] ?? 0) << 8) | (bytes[cursor.offset + 1] ?? 0);
    cursor.offset += 2;
    return value + 253;
  }
  if (first === 255) {
    const value = ((bytes[cursor.offset] ?? 0) << 8) | (bytes[cursor.offset + 1] ?? 0);
    cursor.offset += 2;
    return value + 506;
  }
  return first;
}

export function tableIsTransformed(tag: string, transform: number): boolean {
  const name = tag.trim();
  if (name === "glyf" || name === "loca") return transform !== 3;
  if (name === "hmtx") return transform === 1;
  return transform !== 0;
}

function bitAt(bitmap: Uint8Array, index: number): boolean {
  const byte = bitmap[Math.floor(index / 8)] ?? 0;
  return Boolean(byte & (0x80 >> (index % 8)));
}

function padGlyph(data: Uint8Array): Uint8Array {
  if (data.byteLength % 2 === 0) return data;
  const padded = new Uint8Array(data.byteLength + 1);
  padded.set(data);
  return padded;
}

function writeSimpleGlyph(contours: number, endPts: number[], flags: number[], xs: number[], ys: number[], xMin: number, yMin: number, xMax: number, yMax: number, instructions: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + endPts.length * 2 + 2 + instructions.byteLength + flags.length + xs.length * 2 + ys.length * 2);
  const view = new DataView(bytes.buffer);
  view.setInt16(0, contours, false);
  view.setInt16(2, xMin, false);
  view.setInt16(4, yMin, false);
  view.setInt16(6, xMax, false);
  view.setInt16(8, yMax, false);
  let offset = 10;
  for (const end of endPts) {
    view.setUint16(offset, end, false);
    offset += 2;
  }
  view.setUint16(offset, instructions.byteLength, false);
  offset += 2;
  bytes.set(instructions, offset);
  offset += instructions.byteLength;
  bytes.set(Uint8Array.from(flags), offset);
  offset += flags.length;
  for (const x of xs) {
    view.setInt16(offset, x, false);
    offset += 2;
  }
  for (const y of ys) {
    view.setInt16(offset, y, false);
    offset += 2;
  }
  return padGlyph(bytes.subarray(0, offset));
}

function decodeTriplet(flag: number, stream: Uint8Array, cursor: { offset: number }): { dx: number; dy: number } | undefined {
  if (flag > 127) return undefined;
  const byteCount = flag < 84 ? 1 : flag < 120 ? 2 : flag < 124 ? 3 : 4;
  const raw: number[] = [];
  for (let index = 0; index < byteCount; index++) raw.push(stream[cursor.offset++] ?? 0);
  // Spec table 5.2: flags 0-83 are one-byte with packed dx/dy. Use the
  // widely implemented MTX mapping used by WOFF2 reference decoders.
  if (flag < 10) {
    return { dx: 0, dy: flag & 1 ? raw[0]! : -(raw[0] ?? 0) };
  }
  let dx = 0;
  let dy = 0;
  if (byteCount === 1) {
    const value = raw[0] ?? 0;
    dx = flag & 1 ? value : -value;
  } else if (byteCount === 2) {
    dx = flag & 1 ? (raw[0] ?? 0) : -(raw[0] ?? 0);
    dy = flag & 2 ? (raw[1] ?? 0) : -(raw[1] ?? 0);
  } else if (byteCount === 3) {
    dx = ((raw[0] ?? 0) << 4) | ((raw[1] ?? 0) >> 4);
    dy = (((raw[1] ?? 0) & 0x0f) << 8) | (raw[2] ?? 0);
    if (!(flag & 1)) dx = -dx;
    if (!(flag & 2)) dy = -dy;
  } else {
    dx = ((raw[0] ?? 0) << 8) | (raw[1] ?? 0);
    dy = ((raw[2] ?? 0) << 8) | (raw[3] ?? 0);
    if (!(flag & 1)) dx = -dx;
    if (!(flag & 2)) dy = -dy;
  }
  return { dx, dy };
}

export function reconstructTransformedGlyf(data: Uint8Array): { glyf: Uint8Array; loca: Uint8Array; xMins: number[] } | undefined {
  if (data.byteLength < 36) return undefined;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (readU16(view, 0) !== 0) return undefined;
  const optionFlags = readU16(view, 2);
  const numGlyphs = readU16(view, 4);
  const indexFormat = readU16(view, 6);
  const sizes = [8, 12, 16, 20, 24, 28, 32].map((offset) => readU32(view, offset));
  const [
    nContourSize, nPointsSize, flagSize, glyphSize, compositeSize, bboxSize, instructionSize,
  ] = sizes;
  let cursor = 36;
  const nContour = data.subarray(cursor, cursor + nContourSize); cursor += nContourSize;
  const nPoints = data.subarray(cursor, cursor + nPointsSize); cursor += nPointsSize;
  const flags = data.subarray(cursor, cursor + flagSize); cursor += flagSize;
  const glyphStream = data.subarray(cursor, cursor + glyphSize); cursor += glyphSize;
  cursor += compositeSize;
  const bboxBlock = data.subarray(cursor, cursor + bboxSize); cursor += bboxSize;
  const instructions = data.subarray(cursor, cursor + instructionSize); cursor += instructionSize;
  const bboxBitmapSize = 4 * Math.floor((numGlyphs + 31) / 32);
  if (bboxBlock.byteLength < bboxBitmapSize) return undefined;
  const bboxBitmap = bboxBlock.subarray(0, bboxBitmapSize);
  const bboxStream = bboxBlock.subarray(bboxBitmapSize);
  const overlap = optionFlags & 1 ? data.subarray(cursor) : new Uint8Array();

  const nContourView = new DataView(nContour.buffer, nContour.byteOffset, nContour.byteLength);
  const glyphs: Uint8Array[] = [];
  const locaOffsets = [0];
  const xMins: number[] = [];
  const nPointsCursor = { offset: 0 };
  const flagCursor = { offset: 0 };
  const glyphCursor = { offset: 0 };
  const instructionCursor = { offset: 0 };
  let bboxCursor = 0;
  let glyfSize = 0;

  for (let index = 0; index < numGlyphs; index++) {
    if ((index + 1) * 2 > nContour.byteLength) return undefined;
    const contours = nContourView.getInt16(index * 2, false);
    if (contours === 0) {
      if (bitAt(bboxBitmap, index)) return undefined;
      xMins.push(0);
      locaOffsets.push(glyfSize);
      continue;
    }
    if (contours < 0) return undefined;
    const counts: number[] = [];
    for (let contour = 0; contour < contours; contour++) counts.push(read255UInt16(nPoints, nPointsCursor));
    const endPts: number[] = [];
    let total = 0;
    for (const count of counts) {
      total += count;
      endPts.push(total - 1);
    }
    const pointFlags: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    let x = 0;
    let y = 0;
    for (let point = 0; point < total; point++) {
      const flag = flags[flagCursor.offset++] ?? 0;
      const triplet = decodeTriplet(flag & 0x7f, glyphStream, glyphCursor);
      if (!triplet) return undefined;
      x += triplet.dx;
      y += triplet.dy;
      xs.push(x);
      ys.push(y);
      let reconstructed = flag & 0x01 ? 1 : 0;
      if (optionFlags & 1 && bitAt(overlap, index)) reconstructed |= 0x40;
      pointFlags.push(reconstructed);
    }
    const instructionLength = read255UInt16(glyphStream, glyphCursor);
    const glyphInstructions = instructions.subarray(instructionCursor.offset, instructionCursor.offset + instructionLength);
    instructionCursor.offset += instructionLength;
    let xMin = Math.min(...xs, 0);
    let yMin = Math.min(...ys, 0);
    let xMax = Math.max(...xs, 0);
    let yMax = Math.max(...ys, 0);
    if (bitAt(bboxBitmap, index)) {
      const bboxView = new DataView(bboxStream.buffer, bboxStream.byteOffset, bboxStream.byteLength);
      xMin = readI16(bboxView, bboxCursor); bboxCursor += 2;
      yMin = readI16(bboxView, bboxCursor); bboxCursor += 2;
      xMax = readI16(bboxView, bboxCursor); bboxCursor += 2;
      yMax = readI16(bboxView, bboxCursor); bboxCursor += 2;
    }
    xMins.push(xMin);
    const glyph = writeSimpleGlyph(contours, endPts, pointFlags, xs, ys, xMin, yMin, xMax, yMax, glyphInstructions);
    glyphs.push(glyph);
    glyfSize += glyph.byteLength;
    locaOffsets.push(glyfSize);
  }

  const glyf = new Uint8Array(glyfSize);
  let offset = 0;
  for (const glyph of glyphs) {
    glyf.set(glyph, offset);
    offset += glyph.byteLength;
  }
  const loca = new Uint8Array((numGlyphs + 1) * (indexFormat ? 4 : 2));
  const locaView = new DataView(loca.buffer);
  locaOffsets.forEach((value, index) => {
    if (indexFormat) locaView.setUint32(index * 4, value, false);
    else locaView.setUint16(index * 2, Math.floor(value / 2), false);
  });
  return { glyf, loca, xMins };
}

export function reconstructTransformedHmtx(
  data: Uint8Array,
  numGlyphs: number,
  numberOfHMetrics: number,
  xMins: readonly number[],
): Uint8Array | undefined {
  if (data.byteLength < 1 || numberOfHMetrics < 1) return undefined;
  const flags = data[0] ?? 0;
  if (!(flags & 3) || flags >> 2) return undefined;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let cursor = 1;
  const advances: number[] = [];
  for (let index = 0; index < numberOfHMetrics; index++) {
    if (cursor + 2 > data.byteLength) return undefined;
    advances.push(view.getUint16(cursor, false));
    cursor += 2;
  }
  const lsbs: number[] = [];
  if (!(flags & 1)) {
    for (let index = 0; index < numberOfHMetrics; index++) {
      if (cursor + 2 > data.byteLength) return undefined;
      lsbs.push(view.getInt16(cursor, false));
      cursor += 2;
    }
  } else {
    for (let index = 0; index < numberOfHMetrics; index++) lsbs.push(xMins[index] ?? 0);
  }
  const mono = numGlyphs - numberOfHMetrics;
  const monoLsb: number[] = [];
  if (!(flags & 2)) {
    for (let index = 0; index < mono; index++) {
      if (cursor + 2 > data.byteLength) return undefined;
      monoLsb.push(view.getInt16(cursor, false));
      cursor += 2;
    }
  } else {
    for (let index = 0; index < mono; index++) monoLsb.push(xMins[numberOfHMetrics + index] ?? 0);
  }
  const output = new Uint8Array(numberOfHMetrics * 4 + mono * 2);
  const out = new DataView(output.buffer);
  for (let index = 0; index < numberOfHMetrics; index++) {
    out.setUint16(index * 4, advances[index] ?? 0, false);
    out.setInt16(index * 4 + 2, lsbs[index] ?? 0, false);
  }
  monoLsb.forEach((value, index) => out.setInt16(numberOfHMetrics * 4 + index * 2, value, false));
  return output;
}

export function encodeEmptyTransformedGlyf(numGlyphs: number, indexFormat = 0): Uint8Array {
  const nContour = new Uint8Array(numGlyphs * 2);
  const bboxBitmapSize = 4 * Math.floor((numGlyphs + 31) / 32);
  const bbox = new Uint8Array(bboxBitmapSize);
  const bytes = new Uint8Array(36 + nContour.byteLength + bbox.byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint16(4, numGlyphs, false);
  view.setUint16(6, indexFormat, false);
  view.setUint32(8, nContour.byteLength, false);
  view.setUint32(28, bbox.byteLength, false);
  bytes.set(nContour, 36);
  bytes.set(bbox, 36 + nContour.byteLength);
  return bytes;
}
