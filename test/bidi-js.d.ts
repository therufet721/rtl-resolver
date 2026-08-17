declare module "bidi-js" {
  interface EmbeddingLevels {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }
  interface BidiJs {
    getEmbeddingLevels(text: string, direction?: "ltr" | "rtl"): EmbeddingLevels;
    getReorderedIndices(text: string, levels: EmbeddingLevels): number[];
  }
  export default function bidiFactory(): BidiJs;
}
