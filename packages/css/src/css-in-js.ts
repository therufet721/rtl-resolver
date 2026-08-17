export interface CssTemplateSlice {
  css: string;
  offset: number;
  end: number;
  line: number;
  column: number;
}

function lineColumn(source: string, offset: number) {
  const before = source.slice(0, offset);
  const line = before.split("\n").length;
  return { line, column: offset - (before.lastIndexOf("\n") + 1) + 1 };
}

function skipWhitespace(source: string, index: number): number {
  while (index < source.length && /\s/.test(source[index] ?? "")) index++;
  return index;
}

function skipQuoted(source: string, index: number): number {
  const quote = source[index];
  if (quote !== "'" && quote !== '"' && quote !== "`") return index;
  for (let cursor = index + 1; cursor < source.length; cursor++) {
    if (source[cursor] === "\\") {
      cursor++;
      continue;
    }
    if (source[cursor] === quote) return cursor;
  }
  return source.length - 1;
}

export function skipBalanced(source: string, index: number, open: string, close: string): number {
  if (source[index] !== open) return index;
  let depth = 0;
  for (let cursor = index; cursor < source.length; cursor++) {
    const character = source[cursor];
    if (character === "\\") {
      cursor++;
      continue;
    }
    if (character === "'" || character === '"' || (character === "`" && open !== "`")) {
      cursor = skipQuoted(source, cursor);
      continue;
    }
    if (character === "/" && source[cursor + 1] === "*") {
      const end = source.indexOf("*/", cursor + 2);
      cursor = end < 0 ? source.length : end + 1;
      continue;
    }
    if (character === open) depth++;
    else if (character === close) {
      depth--;
      if (depth === 0) return cursor;
    }
  }
  return source.length;
}

export function readTemplate(source: string, start: number): { text: string; end: number } {
  let text = "";
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (character === "\\") {
      text += character + (source[index + 1] ?? "");
      index++;
      continue;
    }
    if (character === "`") return { text, end: index };
    if (character === "$" && source[index + 1] === "{") {
      const close = skipBalanced(source, index + 1, "{", "}");
      text += source.slice(index, close + 1).replace(/[^\n]/g, " ");
      index = close;
      continue;
    }
    text += character;
  }
  return { text, end: source.length };
}

function skipTagSuffix(source: string, index: number): number {
  let cursor = skipWhitespace(source, index);
  while (source[cursor] === ".") {
    cursor++;
    while (/[A-Za-z0-9_$]/.test(source[cursor] ?? "")) cursor++;
    cursor = skipWhitespace(source, cursor);
    if (source[cursor] === "(") cursor = skipBalanced(source, cursor, "(", ")") + 1;
    cursor = skipWhitespace(source, cursor);
  }
  if (source[cursor] === "<") {
    cursor = skipBalanced(source, cursor, "<", ">") + 1;
    cursor = skipWhitespace(source, cursor);
  }
  if (source[cursor] === "(") {
    cursor = skipBalanced(source, cursor, "(", ")") + 1;
    cursor = skipWhitespace(source, cursor);
  }
  if (source.slice(cursor, cursor + 6) === ".attrs") {
    cursor = skipWhitespace(source, cursor + 6);
    if (source[cursor] === "(") cursor = skipBalanced(source, cursor, "(", ")") + 1;
    cursor = skipWhitespace(source, cursor);
  }
  return cursor;
}

const CSS_TAGS = /\b(?:css|keyframes|createGlobalStyle|injectGlobal|globalStyle|styled)\b/g;

/** Extract CSS from css`...`, styled.div`...`, and similar tagged templates. */
export function extractCssTaggedTemplates(source: string): CssTemplateSlice[] {
  const slices: CssTemplateSlice[] = [];
  for (const match of source.matchAll(CSS_TAGS)) {
    const afterName = (match.index ?? 0) + match[0].length;
    const tick = skipTagSuffix(source, afterName);
    if (source[tick] !== "`") continue;
    const extracted = readTemplate(source, tick + 1);
    slices.push({
      css: extracted.text,
      offset: tick + 1,
      end: extracted.end,
      ...lineColumn(source, tick + 1),
    });
  }
  return slices;
}

/** Replace tagged-template CSS with spaces so JS scans do not double-count it. */
export function maskCssTaggedTemplates(source: string): string {
  let masked = source;
  for (const slice of extractCssTaggedTemplates(source)) {
    masked = `${masked.slice(0, slice.offset)}${masked.slice(slice.offset, slice.end).replace(/[^\n]/g, " ")}${masked.slice(slice.end)}`;
  }
  return masked;
}
