export interface ShapedGlyph {
  glyphId: number;
  cluster: number;
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
}

export interface ShapeResult {
  engine: "harfbuzz";
  version: string;
  glyphs: ShapedGlyph[];
  gsubFeatures: readonly string[];
  gposFeatures: readonly string[];
  joined: boolean;
  note: string;
}

type HarfBuzzModule = typeof import("harfbuzzjs");

let loaded: Promise<HarfBuzzModule> | undefined;

function loadHarfbuzz(): Promise<HarfBuzzModule> {
  loaded ??= import("harfbuzzjs");
  return loaded;
}

/** HarfBuzz library version from the WASM build. */
export async function harfbuzzVersion(): Promise<string> {
  const hb = await loadHarfbuzz();
  return hb.versionString();
}

function needsJoining(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Shape text with HarfBuzz WASM. Joining/ligature quality still depends on
 * the supplied font's GSUB/GPOS features.
 */
export async function shapeWithHarfbuzz(
  fontData: ArrayBuffer | Uint8Array,
  text: string,
  options: { direction?: "ltr" | "rtl"; language?: string; script?: string } = {},
): Promise<ShapeResult> {
  const hb = await loadHarfbuzz();
  const bytes = fontData instanceof Uint8Array ? fontData : new Uint8Array(fontData);
  const blob = new hb.Blob(bytes);
  const face = new hb.Face(blob);
  const font = new hb.Font(face);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  if (options.language) buffer.setLanguage(options.language);
  if (options.script) buffer.setScript(options.script);
  if (options.direction) buffer.setDirection(options.direction === "rtl" ? hb.Direction.RTL : hb.Direction.LTR);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const infos = buffer.getGlyphInfos();
  const positions = buffer.getGlyphPositions();
  const glyphs = infos.map((info, index) => ({
    glyphId: info.codepoint,
    cluster: info.cluster,
    xAdvance: positions[index]?.xAdvance ?? 0,
    yAdvance: positions[index]?.yAdvance ?? 0,
    xOffset: positions[index]?.xOffset ?? 0,
    yOffset: positions[index]?.yOffset ?? 0,
  }));
  const gsubFeatures = face.getTableFeatureTags("GSUB");
  const gposFeatures = face.getTableFeatureTags("GPOS");
  const joiningScript = needsJoining(text);
  const joiningFeatures = gsubFeatures.some((tag) => /init|medi|fina|isol|rlig|liga/i.test(tag));
  return {
    engine: "harfbuzz",
    version: hb.versionString(),
    glyphs,
    gsubFeatures,
    gposFeatures,
    joined: joiningScript && joiningFeatures && glyphs.length > 0,
    note: joiningScript && !joiningFeatures
      ? "HarfBuzz ran. This font has no GSUB joining features, so Arabic joining quality is not proven."
      : "Shaped with HarfBuzz WASM.",
  };
}
