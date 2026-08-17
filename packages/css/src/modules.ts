/** True for CSS Modules filenames such as `Button.module.css`. */
export function isCssModulesFile(file: string): boolean {
  return /\.module\.(?:css|scss|sass|less)$/i.test(file);
}

function skipCommentOrString(source: string, index: number): number {
  const character = source[index];
  if (character === "/" && source[index + 1] === "*") {
    const end = source.indexOf("*/", index + 2);
    return end < 0 ? source.length : end + 1;
  }
  if (character === "'" || character === '"') {
    for (let cursor = index + 1; cursor < source.length; cursor++) {
      if (source[cursor] === "\\") {
        cursor++;
        continue;
      }
      if (source[cursor] === character) return cursor;
    }
    return source.length - 1;
  }
  return index;
}

function braceRange(source: string, openIndex: number): [number, number] | undefined {
  if (source[openIndex] !== "{") return undefined;
  let depth = 0;
  for (let cursor = openIndex; cursor < source.length; cursor++) {
    cursor = skipCommentOrString(source, cursor);
    const character = source[cursor];
    if (character === "{") depth++;
    else if (character === "}") {
      depth--;
      if (depth === 0) return [openIndex, cursor + 1];
    }
  }
  return [openIndex, source.length];
}

function rangesFrom(source: string, pattern: RegExp): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    ranges.push([index, index + match[0].length]);
  }
  return ranges;
}

function icssBlockRanges(source: string, header: RegExp): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const match of source.matchAll(header)) {
    const brace = source.indexOf("{", (match.index ?? 0) + match[0].length - 1);
    if (brace < 0) continue;
    const range = braceRange(source, brace);
    if (range) ranges.push([match.index ?? 0, range[1]]);
  }
  return ranges;
}

/**
 * Ranges that look like CSS declarations but are CSS Modules / ICSS chrome:
 * `:export`, `:import(...)`, `@value`, and `composes`.
 * Declarations inside `:global` / `:local` are real CSS and stay visible.
 */
export function cssModulesIgnoreRanges(source: string): Array<[number, number]> {
  return [
    ...icssBlockRanges(source, /:export\b/g),
    ...icssBlockRanges(source, /:import\b/g),
    ...rangesFrom(source, /@value\b[^;]*;/g),
    ...rangesFrom(source, /(?<=^|[;{\s])composes\s*:[^;{}]+/gi),
  ];
}

export function offsetInRanges(offset: number, ranges: readonly [number, number][]): boolean {
  return ranges.some(([start, end]) => offset >= start && offset < end);
}
