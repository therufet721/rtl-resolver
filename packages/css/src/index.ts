export { extractCssTaggedTemplates, maskCssTaggedTemplates } from "./css-in-js.js";
export { analyzeJsAst, extractCssSlicesFromJs } from "./js-ast.js";
export { isCssModulesFile } from "./modules.js";
import { maskCssTaggedTemplates } from "./css-in-js.js";
import { analyzeJsAst, extractCssSlicesFromJs, safeJsStyleEdits } from "./js-ast.js";
import { cssModulesIgnoreRanges, isCssModulesFile, offsetInRanges } from "./modules.js";
import { CAMEL_TO_KEBAB, isFourValuePhysical, KEBAB_SAFE, POSITIONING } from "./properties.js";

export type CssFindingKind = "physical-property" | "physical-value" | "directional-utility" | "manual-review";

export interface CssFinding {
  kind: CssFindingKind;
  property?: string;
  replacement?: string;
  value: string;
  line: number;
  column: number;
  message: string;
}

export function findingKey(finding: CssFinding): string {
  return `${finding.kind}|${finding.message}`;
}

export function filterFindingsByBaseline(findings: readonly CssFinding[], baseline: readonly string[]): CssFinding[] {
  const known = new Set(baseline);
  return findings.filter((finding) => !known.has(findingKey(finding)));
}

export function baselineFromFindings(findings: readonly CssFinding[]): string[] {
  return [...new Set(findings.map(findingKey))].sort();
}

const UTILITY = /\b(?:ml|mr|pl|pr|left|right|text)-(?:\d+|auto|0|4|6|8)\b/g;

function lineColumn(source: string, offset: number) {
  const before = source.slice(0, offset);
  const line = before.split("\n").length;
  return { line, column: offset - (before.lastIndexOf("\n") + 1) + 1 };
}

function isJsLike(file: string): boolean {
  return !/\.(?:css|scss|sass|less)$/i.test(file);
}

function dedupeFindings(findings: CssFinding[]): CssFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.line}:${finding.column}:${finding.property ?? finding.value}:${finding.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyzeCss(
  source: string,
  file = "<inline>",
  origin?: { source: string; offset: number },
): CssFinding[] {
  const findings: CssFinding[] = [];
  const modules = isCssModulesFile(file);
  const ignored = modules ? cssModulesIgnoreRanges(source) : [];
  const locate = (offset: number) => origin
    ? lineColumn(origin.source, origin.offset + offset)
    : lineColumn(source, offset);
  const declaration = /(^|[;{])\s*([a-z-]+)\s*:\s*([^;{}]+)/gi;
  for (const match of source.matchAll(declaration)) {
    const property = match[2].toLowerCase();
    const value = match[3].trim();
    const offset = match.index ?? 0;
    if (offsetInRanges(offset, ignored)) continue;
    const position = locate(offset);
    if (KEBAB_SAFE[property]) {
      findings.push({ kind: "physical-property", property, replacement: KEBAB_SAFE[property], value, ...position, message: `${file}:${position.line}:${position.column} ${property} can become ${KEBAB_SAFE[property]}` });
    }
    if (POSITIONING[property]) {
      findings.push({ kind: "manual-review", property, replacement: POSITIONING[property], value, ...position, message: `${file}:${position.line}:${position.column} ${property} is physical positioning and requires direction review` });
    }
    if (property === "text-align" && /^(left|right)$/i.test(value)) {
      findings.push({ kind: "physical-value", property, value, ...position, message: `${file}:${position.line}:${position.column} text-align:${value} can become text-align:${value === "left" ? "start" : "end"}` });
    }
    if (property === "transform" && /translateX\(/i.test(value)) {
      findings.push({ kind: "manual-review", property, value, ...position, message: `${file}:${position.line}:${position.column} horizontal transform requires direction review` });
    }
    if (property === "float" && /^(left|right)$/i.test(value)) {
      findings.push({ kind: "manual-review", property, value, ...position, message: `${file}:${position.line}:${position.column} float:${value} requires logical layout review` });
    }
    if ((property === "background" || property === "background-image") && /linear-gradient\s*\([^)]*\bto\s+(left|right)\b/i.test(value)) {
      findings.push({ kind: "manual-review", property, value, ...position, message: `${file}:${position.line}:${position.column} directional gradient requires direction review` });
    }
    if (property === "box-shadow" && /^\s*-?\d+(?:px|rem|em)/i.test(value)) {
      findings.push({ kind: "manual-review", property, value, ...position, message: `${file}:${position.line}:${position.column} horizontal shadow offset may need direction review` });
    }
    if (isFourValuePhysical(property, value)) {
      findings.push({ kind: "manual-review", property, value, ...position, message: `${file}:${position.line}:${position.column} four-value ${property} is physical and requires direction review` });
    }
  }
  if (!modules) {
    for (const match of source.matchAll(UTILITY)) {
      const index = match.index ?? 0;
      if (offsetInRanges(index, ignored)) continue;
      const position = locate(index);
      findings.push({ kind: "directional-utility", value: match[0], ...position, message: `${file}:${position.line}:${position.column} directional utility ${match[0]} requires logical review` });
    }
  }
  return findings;
}

function analyzeJsSource(source: string, file: string): CssFinding[] {
  const findings: CssFinding[] = [];
  const propertyPattern = /(?<![-\w])(marginLeft|marginRight|paddingLeft|paddingRight|textAlign)\s*:/g;
  for (const match of source.matchAll(propertyPattern)) {
    const property = match[1];
    const offset = match.index ?? 0;
    const position = lineColumn(source, offset);
    findings.push({
      kind: "physical-property", property, replacement: CAMEL_TO_KEBAB[property], value: property,
      ...position, message: `${file}:${position.line}:${position.column} ${property} in a style object can become ${CAMEL_TO_KEBAB[property]}`,
    });
  }
  for (const match of source.matchAll(/(?<![-\w])(left|right)\s*:/g)) {
    const position = lineColumn(source, match.index ?? 0);
    findings.push({
      kind: "manual-review", property: match[1], replacement: POSITIONING[match[1]], value: match[1],
      ...position, message: `${file}:${position.line}:${position.column} ${match[1]} in a style object is physical positioning and requires direction review`,
    });
  }
  for (const match of source.matchAll(/\bdir\s*=\s*["']ltr["']/g)) {
    const position = lineColumn(source, match.index ?? 0);
    findings.push({ kind: "manual-review", value: "dir=\"ltr\"", ...position,
      message: `${file}:${position.line}:${position.column} hard-coded dir=\"ltr\" requires direction review` });
  }
  if (/\bscrollLeft\b|Arrow(?:Left|Right)/.test(source)) {
    const offset = source.search(/\bscrollLeft\b|Arrow(?:Left|Right)/);
    const position = lineColumn(source, offset);
    findings.push({ kind: "manual-review", value: "directional browser interaction", ...position,
      message: `${file}:${position.line}:${position.column} directional browser interaction requires logical normalization` });
  }
  return findings;
}

/** Analyze CSS plus JSX/TSX style objects, tagged CSS-in-JS templates, and browser-direction patterns. */
export function analyzeSource(source: string, file = "<inline>"): CssFinding[] {
  if (!isJsLike(file)) return analyzeCss(source, file);
  const findings: CssFinding[] = [];
  for (const slice of extractCssSlicesFromJs(source)) {
    findings.push(...analyzeCss(slice.css, file, { source, offset: slice.offset }));
  }
  const astFindings = analyzeJsAst(source, file);
  findings.push(...(astFindings ?? analyzeJsSource(maskCssTaggedTemplates(source), file)));
  return dedupeFindings(findings);
}

export function suggestLogicalProperty(property: string): string | undefined {
  const key = property.toLowerCase();
  return KEBAB_SAFE[key] ?? POSITIONING[key];
}

export interface CssMigrationResult { source: string; output: string; changed: number; findings: CssFinding[]; }

function replaceOutside(
  source: string,
  pattern: RegExp,
  ignored: readonly [number, number][],
  replace: (...args: string[]) => string,
): { output: string; changed: number } {
  let changed = 0;
  const output = source.replace(pattern, (...args: string[]) => {
    const offset = Number(args[args.length - 2]);
    if (offsetInRanges(offset, ignored)) return args[0];
    changed++;
    return replace(...args);
  });
  return { output, changed };
}

/** Apply only mechanical, semantics-preserving property/value replacements. */
export function migrateCss(source: string, file = "<inline>"): CssMigrationResult {
  const findings = analyzeCss(source, file);
  const ignored = isCssModulesFile(file) ? cssModulesIgnoreRanges(source) : [];
  let output = source;
  let changed = 0;
  for (const [property, replacement] of Object.entries(KEBAB_SAFE)) {
    const next = replaceOutside(
      output,
      new RegExp(`(^|[;{])(\\s*)${property}(\\s*:)`, "gi"),
      ignored,
      (_match, prefix: string, space: string, suffix: string) => `${prefix}${space}${replacement}${suffix}`,
    );
    output = next.output;
    changed += next.changed;
  }
  const textLeft = replaceOutside(output, /(text-align\s*:\s*)left\b/gi, ignored, (_match, prefix: string) => `${prefix}start`);
  output = textLeft.output;
  changed += textLeft.changed;
  const textRight = replaceOutside(output, /(text-align\s*:\s*)right\b/gi, ignored, (_match, prefix: string) => `${prefix}end`);
  output = textRight.output;
  changed += textRight.changed;
  return { source, output, changed, findings };
}

function applyEdits(source: string, edits: Array<{ start: number; end: number; text: string }>): { output: string; changed: number } {
  const ordered = [...edits].sort((a, b) => b.start - a.start);
  let output = source;
  let changed = 0;
  let previous = Number.POSITIVE_INFINITY;
  for (const edit of ordered) {
    if (edit.end > previous) continue;
    if (output.slice(edit.start, edit.end) === edit.text) continue;
    output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`;
    previous = edit.start;
    changed++;
  }
  return { output, changed };
}

/**
 * Migrate CSS files and CSS-in-JS sources. Tagged templates and style objects
 * get the same safe replacements as CSS. Same-file identifier spreads and
 * computed string keys are analyzed. Interpolations and unknown factories
 * are left untouched.
 */
export function migrateSource(source: string, file = "<inline>"): CssMigrationResult {
  if (!isJsLike(file)) return migrateCss(source, file);
  const findings = analyzeSource(source, file);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  for (const slice of extractCssSlicesFromJs(source)) {
    const original = source.slice(slice.offset, slice.end);
    const result = migrateCss(original, file);
    if (result.changed && result.output !== original) {
      edits.push({ start: slice.offset, end: slice.end, text: result.output });
    }
  }
  const objectEdits = safeJsStyleEdits(source) ?? [];
  edits.push(...objectEdits);
  const applied = applyEdits(source, edits);
  return { source, output: applied.output, changed: applied.changed, findings };
}

/** Optional PostCSS-compatible plugin; PostCSS remains a peer dependency. */
export function logicalPropertiesPlugin(options: { preserve?: boolean } = {}) {
  return {
    postcssPlugin: "rtl-resolver-logical-properties",
    Once(root: any) {
      root.walkDecls((decl: any) => {
        const replacement = KEBAB_SAFE[decl.prop.toLowerCase()];
        if (!replacement) {
          if (decl.prop.toLowerCase() === "text-align" && /^(left|right)$/i.test(decl.value.trim())) {
            if (options.preserve) decl.cloneBefore({ prop: decl.prop, value: decl.value.trim() === "left" ? "start" : "end" });
            else decl.value = decl.value.trim() === "left" ? "start" : "end";
          }
          return;
        }
        if (options.preserve) decl.cloneBefore({ prop: replacement });
        else decl.prop = replacement;
      });
    },
  };
}
logicalPropertiesPlugin.postcss = true;

/** Audit plugin that reports directional Tailwind-style utility classes. */
export function tailwindPlugin(): { name: string; audit(context: { files: readonly string[]; readFile(file: string): string }): Array<{ kind: string; message: string; file: string; line: number; column: number }> } {
  return {
    name: "tailwind",
    audit({ files, readFile }) {
      const findings: Array<{ kind: string; message: string; file: string; line: number; column: number }> = [];
      for (const file of files) {
        if (!/\.(?:tsx|jsx|ts|js|html)$/i.test(file)) continue;
        const source = readFile(file);
        for (const match of source.matchAll(/\b(?:ml|mr|pl|pr|left|right|text)-(?:\d+|auto|0|4|6|8)\b/g)) {
          const before = source.slice(0, match.index ?? 0);
          const line = before.split("\n").length;
          findings.push({
            kind: "directional-utility",
            message: `directional utility ${match[0]} requires logical review`,
            file,
            line,
            column: (match.index ?? 0) - (before.lastIndexOf("\n") + 1) + 1,
          });
        }
      }
      return findings;
    },
  };
}
