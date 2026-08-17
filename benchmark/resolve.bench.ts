import { bench, describe } from "vitest";
import { analyzeBidi, resolveBidiLevels } from "../packages/core/src/bidi/resolve.js";
import bidiFactory from "bidi-js";

describe("bidi resolver throughput", () => {
  const bidi = bidiFactory();
  const ascii = "The quick brown fox jumps over the lazy dog. ".repeat(100);
  const mixed = "Hello שלום مرحبا 123 — mixed text. ".repeat(100);

  bench("ASCII levels", () => resolveBidiLevels(ascii));
  bench("mixed analysis", () => analyzeBidi(mixed));
  bench("bidi-js mixed embedding levels", () => bidi.getEmbeddingLevels(mixed));
});
