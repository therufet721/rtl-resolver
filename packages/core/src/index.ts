import type { RTLPlugin } from "./plugin.js";

export type Direction = "ltr" | "rtl";
export type DirectionPreference = Direction | "auto";

export type {
  RTLPlugin,
  RTLPluginContext,
  RTLPluginFinding,
  RTLPluginMigration,
  RTLPluginDiagnostic,
} from "./plugin.js";

export interface RTLConfig {
  locales?: Record<string, Direction>;
  physicalExceptions?: readonly string[];
  icons?: Record<string, unknown>;
  fonts?: Record<string, unknown>;
  lint?: Record<string, unknown>;
  gestures?: Record<string, unknown>;
  plugins?: readonly (RTLPlugin | string)[];
}

export function defineRTLConfig(config: RTLConfig): Readonly<RTLConfig> {
  return Object.freeze({ ...config });
}

/** Languages whose customary writing direction is right-to-left. */
export const RTL_LANGUAGES = new Set([
  "ar", "arc", "ckb", "dv", "fa", "he", "khw", "ks", "ku", "nqo",
  "ps", "sd", "syr", "ug", "ur", "yi"
]);

// Hebrew is intentionally limited to the Hebrew block. Arabic presentation
// forms (FB50–FDFF/FE70–FEFF) must not be classified as Hebrew.
const RTL_CHAR = /[\u0590-\u05FF\u0600-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;
const LTR_CHAR = /[A-Za-z\u00C0-\u02AF\u0370-\u058F\u0900-\u1FFF\u2C00-\uD7FF\uF900-\uFB1C]/u;
const STRONG_CHAR = new RegExp(`(?:${RTL_CHAR.source})|(?:${LTR_CHAR.source})`, "u");

/** Return the normalized primary language subtag, or an empty string. */
export function languageOf(locale: string): string {
  const value = locale.trim().replace(/_/g, "-");
  if (!value) return "";
  try {
    return new Intl.Locale(value).language.toLowerCase();
  } catch {
    return value.split("-")[0]?.toLowerCase() ?? "";
  }
}

/** Resolve the customary direction for a BCP 47 locale. */
export function directionFromLocale(locale: string, fallback: Direction = "ltr"): Direction {
  const language = languageOf(locale);
  return language ? (RTL_LANGUAGES.has(language) ? "rtl" : "ltr") : fallback;
}

/** Public alias for locale direction resolution. */
export const getDirection = directionFromLocale;

export function isRTL(locale: string): boolean { return directionFromLocale(locale) === "rtl"; }
export function isLTR(locale: string): boolean { return directionFromLocale(locale) === "ltr"; }

export type ScriptName = "arabic" | "persian" | "urdu" | "hebrew" | "latin" | "unknown";

const PERSIAN_MARKERS = new Set([0x067e, 0x0686, 0x0698, 0x06af, 0x06cc]);
const URDU_MARKERS = new Set([0x0679, 0x0688, 0x0691, 0x06ba, 0x06be, 0x06d2]);

function scriptOfCodePoint(code: number): ScriptName {
  if ((code >= 0x0590 && code <= 0x05ff) || (code >= 0xfb1d && code <= 0xfb4f)) return "hebrew";
  if (PERSIAN_MARKERS.has(code)) return "persian";
  if (URDU_MARKERS.has(code) || (code >= 0x06f0 && code <= 0x06f9)) return "urdu";
  if ((code >= 0x0600 && code <= 0x08ff) || (code >= 0xfb50 && code <= 0xfeff)) return "arabic";
  if ((code >= 0x0041 && code <= 0x024f) || (code >= 0x1e00 && code <= 0x1eff)) return "latin";
  return "unknown";
}

export function scriptCounts(text: string): Record<ScriptName, number> {
  const counts: Record<ScriptName, number> = { arabic: 0, persian: 0, urdu: 0, hebrew: 0, latin: 0, unknown: 0 };
  for (const char of text) counts[scriptOfCodePoint(char.codePointAt(0) ?? 0)]++;
  return counts;
}

/** Detect the dominant script family, preferring distinctive RTL markers over shared Arabic letters. */
export function detectScript(text: string): ScriptName {
  const counts = scriptCounts(text);
  const arabicFamily = counts.arabic + counts.persian + counts.urdu;
  const rtl = arabicFamily + counts.hebrew;
  if (rtl >= counts.latin && rtl > 0) {
    if (counts.hebrew > arabicFamily) return "hebrew";
    if (counts.urdu) return "urdu";
    if (counts.persian) return "persian";
    if (arabicFamily) return "arabic";
    return "hebrew";
  }
  if (counts.latin) return "latin";
  return "unknown";
}

/** Detect direction from text, returning the configured fallback for neutral text. */
export const detectDirection = directionFromText;

/** Detect direction from the first strong directional character in a string. */
export function directionFromText(text: string, fallback: Direction = "ltr"): Direction {
  const char = text.match(STRONG_CHAR)?.[0];
  if (!char) return fallback;
  return RTL_CHAR.test(char) ? "rtl" : "ltr";
}

export interface ResolveDirectionOptions {
  direction?: DirectionPreference;
  locale?: string;
  text?: string;
  fallback?: Direction;
}

export type DirectionContext = "page" | "ui" | "content" | "auto";

export interface ResolveContextOptions extends ResolveDirectionOptions {
  /** The semantic layer being resolved. `auto` uses text, then locale. */
  context?: DirectionContext;
}

export type DirectionSource = "explicit" | "text" | "locale" | "fallback";
export interface DirectionResolution {
  direction: Direction;
  source: DirectionSource;
  confidence: "high" | "medium" | "low";
}

/** Resolve direction while preserving why the decision was made. */
export function resolveDirectionDetailed(options: ResolveDirectionOptions = {}): DirectionResolution {
  const { direction = "auto", text, locale, fallback = "ltr" } = options;
  if (direction !== "auto") return { direction, source: "explicit", confidence: "high" };
  if (text) {
    const match = text.match(STRONG_CHAR);
    if (match) return { direction: RTL_CHAR.test(match[0]) ? "rtl" : "ltr", source: "text", confidence: "high" };
  }
  if (locale) return { direction: directionFromLocale(locale, fallback), source: "locale", confidence: "medium" };
  return { direction: fallback, source: "fallback", confidence: "low" };
}

/** Resolve a direction for a page, UI chrome, content, or automatic text. */
export function resolveContextDirection(options: ResolveContextOptions = {}): DirectionResolution {
  const { context = "auto", direction = "auto", locale, text, fallback = "ltr" } = options;
  if (direction !== "auto") return { direction, source: "explicit", confidence: "high" };
  if (context === "content" || context === "auto") {
    if (text) {
      const result = resolveDirectionDetailed({ text, fallback });
      if (result.source === "text") return result;
    }
  }
  if (context === "page" || context === "ui" || locale) {
    if (locale) return { direction: directionFromLocale(locale, fallback), source: "locale", confidence: "medium" };
  }
  return { direction: fallback, source: "fallback", confidence: "low" };
}

/** Resolve direction using explicit direction, text, locale, then fallback. */
export function resolveDirection(options: ResolveDirectionOptions = {}): Direction {
  return resolveDirectionDetailed(options).direction;
}

/** Resolve a `dir="auto"` decision from text without emitting markup. */
export function resolveAutoDirection(text: string, fallback: Direction = "ltr"): Direction {
  return resolveDirectionDetailed({ text, fallback }).direction;
}

export function bdiAttributes(direction: DirectionPreference = "auto"): { dir: DirectionPreference } {
  return { dir: direction };
}

export function bdoAttributes(direction: Direction): { dir: Direction } {
  return { dir: direction };
}

/** Select a value based on the resolved direction. */
export function directional<T>(direction: Direction, values: { ltr: T; rtl: T }): T {
  return values[direction];
}

/** Map logical inline sides to physical CSS sides. */
export function inlineSides(direction: Direction): { start: "left" | "right"; end: "left" | "right" } {
  return direction === "rtl"
    ? { start: "right", end: "left" }
    : { start: "left", end: "right" };
}

/** Wrap potentially mixed-direction text with Unicode isolate controls. */
export function isolate(text: string, direction: DirectionPreference = "auto"): string {
  const opener = direction === "rtl" ? "\u2067" : direction === "ltr" ? "\u2066" : "\u2068";
  return `${opener}${text}\u2069`;
}

const EMBEDDED_LTR = /https?:\/\/\S+|\S+@\S+\.\S+|\b[A-Za-z][A-Za-z0-9._-]{2,}\b/;

/** True when mixed strong direction or an opposite-direction embed should be isolated. */
export function needsIsolation(text: string, surrounding?: Direction): boolean {
  const counts = scriptCounts(text);
  const hasRtl = counts.arabic + counts.persian + counts.urdu + counts.hebrew > 0;
  const hasLtr = counts.latin > 0 || EMBEDDED_LTR.test(text);
  if (hasRtl && hasLtr) return true;
  if (!surrounding) return false;
  const content = directionFromText(text, surrounding);
  return content !== surrounding && Boolean(text.trim());
}

/** Isolate only when mixed-direction risk is present. */
export function isolateIfNeeded(text: string, surrounding?: Direction): string {
  return needsIsolation(text, surrounding) ? isolate(text, "auto") : text;
}
