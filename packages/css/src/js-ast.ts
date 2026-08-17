import { parse } from "@babel/parser";
import { extractCssTaggedTemplates, readTemplate, type CssTemplateSlice } from "./css-in-js.js";
import { CAMEL_SAFE, CAMEL_TO_KEBAB, KEBAB_SAFE, POSITIONING, isFourValuePhysical } from "./properties.js";

type CssFinding = {
  kind: "physical-property" | "physical-value" | "directional-utility" | "manual-review";
  property?: string;
  replacement?: string;
  value: string;
  line: number;
  column: number;
  message: string;
};

export interface JsEdit {
  start: number;
  end: number;
  text: string;
}

interface BabelNode {
  type: string;
  start?: number;
  end?: number;
  loc?: { start: { line: number; column: number } };
  [key: string]: unknown;
}

const CSS_ROOT_NAMES = new Set([
  "css", "cx", "styled", "style", "sx", "cva", "sva", "keyframes",
  "createStyles", "makeStyles", "withStyles", "globalStyle", "styleVariants",
  "cssMap", "recipe", "createGlobalStyle", "injectGlobal",
]);

function propertyName(node: BabelNode): string | undefined {
  const key = node.key as BabelNode | undefined;
  if (!key) return undefined;
  if (node.computed) {
    if (key.type === "StringLiteral") return key.value as string;
    return undefined;
  }
  if (key.type === "Identifier") return key.name as string;
  if (key.type === "StringLiteral") return key.value as string;
  return undefined;
}

function identifierName(node: BabelNode | undefined): string {
  if (!node) return "";
  if (node.type === "Identifier") return String(node.name ?? "");
  if (node.type === "MemberExpression") {
    const object = node.object as BabelNode | undefined;
    const property = node.property as BabelNode | undefined;
    const computed = Boolean(node.computed);
    if (computed) return identifierName(object);
    return `${identifierName(object)}.${String(property?.name ?? "")}`;
  }
  if (node.type === "CallExpression") return identifierName(node.callee as BabelNode | undefined);
  if (node.type === "TaggedTemplateExpression") return identifierName(node.tag as BabelNode | undefined);
  return "";
}

function calleeName(node: BabelNode): string {
  return identifierName(node.callee as BabelNode | undefined);
}

function isCssFactoryName(name: string): boolean {
  if (!name) return false;
  if (name.startsWith("styled.") || name.startsWith("stylex.")) return true;
  const parts = name.split(".");
  return parts.some((part) => CSS_ROOT_NAMES.has(part));
}

function inTypeContext(ancestors: readonly BabelNode[]): boolean {
  return ancestors.some((node) =>
    node.type === "TSTypeLiteral" ||
    node.type === "TSInterfaceBody" ||
    node.type === "TSTypeAliasDeclaration" ||
    node.type === "TSInterfaceDeclaration" ||
    node.type === "TSTypeAnnotation"
  );
}

function inStyleContext(ancestors: readonly BabelNode[]): boolean {
  if (inTypeContext(ancestors)) return false;
  for (let index = ancestors.length - 1; index >= 0; index--) {
    const node = ancestors[index];
    if (node.type === "JSXAttribute") {
      const name = (node.name as BabelNode | undefined)?.name;
      if (name === "style" || name === "sx" || name === "css") return true;
    }
    if (node.type === "CallExpression" && isCssFactoryName(calleeName(node))) return true;
    if (node.type === "TaggedTemplateExpression" && isCssFactoryName(identifierName(node.tag as BabelNode | undefined))) {
      return true;
    }
    if (node.type === "VariableDeclarator") {
      const id = node.id as BabelNode | undefined;
      if (typeof id?.name === "string" && /(?:style|styles|sx|css)$/i.test(id.name)) return true;
    }
    if (node.type === "ObjectProperty") {
      const name = propertyName(node);
      if (name === "style" || name === "sx" || name === "css") return true;
    }
  }
  return false;
}

function walk(node: BabelNode, ancestors: BabelNode[], visit: (node: BabelNode, ancestors: BabelNode[]) => void): void {
  visit(node, ancestors);
  const next = [...ancestors, node];
  for (const value of Object.values(node)) {
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && typeof (child as BabelNode).type === "string") {
          walk(child as BabelNode, next, visit);
        }
      }
    } else if (typeof (value as BabelNode).type === "string") {
      walk(value as BabelNode, next, visit);
    }
  }
}

function parseSource(source: string): BabelNode | null {
  try {
    return parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      ranges: true,
      plugins: ["jsx", "typescript"],
    }) as unknown as BabelNode;
  } catch {
    return null;
  }
}

function looksLikeCss(text: string): boolean {
  return /(?:^|[{;])\s*[a-z-]+\s*:/i.test(text) || /text-align|margin-|padding-|translateX|linear-gradient/i.test(text);
}

function templateSlice(source: string, node: BabelNode): CssTemplateSlice | undefined {
  if (typeof node.start !== "number" || typeof node.end !== "number") return undefined;
  const offset = node.start + 1;
  const extracted = readTemplate(source, offset);
  return {
    css: extracted.text,
    offset,
    end: extracted.end,
    line: node.loc?.start.line ?? 1,
    column: (node.loc?.start.column ?? 0) + 2,
  };
}

function mergeSlices(slices: CssTemplateSlice[]): CssTemplateSlice[] {
  const seen = new Set<string>();
  const merged: CssTemplateSlice[] = [];
  for (const slice of slices) {
    const key = `${slice.offset}:${slice.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(slice);
  }
  return merged.sort((a, b) => a.offset - b.offset);
}

/** Tagged templates plus css(() => `...`) callback templates. */
export function extractCssSlicesFromJs(source: string): CssTemplateSlice[] {
  const slices = [...extractCssTaggedTemplates(source)];
  const ast = parseSource(source);
  if (!ast) return mergeSlices(slices);
  walk(ast, [], (node, ancestors) => {
    if (node.type !== "TemplateLiteral") return;
    const parent = ancestors[ancestors.length - 1];
    if (parent?.type === "TaggedTemplateExpression") return;
    if (!inStyleContext(ancestors)) return;
    if (typeof node.start !== "number") return;
    const inner = source.slice(node.start + 1, (node.end ?? node.start) - 1);
    if (!looksLikeCss(inner)) return;
    const slice = templateSlice(source, node);
    if (slice) slices.push(slice);
  });
  return mergeSlices(slices);
}

function stringValue(node: BabelNode | undefined): string | undefined {
  if (node?.type === "StringLiteral") return String(node.value ?? "");
  if (node?.type === "NumericLiteral") return String(node.value ?? "");
  return undefined;
}

function objectValueNode(node: BabelNode): BabelNode | undefined {
  if (node.type === "ObjectProperty") return node.value as BabelNode | undefined;
  return undefined;
}

function pushFinding(findings: CssFinding[], seen: Set<string>, finding: CssFinding) {
  const key = `${finding.line}:${finding.column}:${finding.property ?? finding.value}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push(finding);
}

function reviewObjectValue(
  file: string,
  name: string,
  value: string,
  line: number,
  column: number,
  findings: CssFinding[],
  seen: Set<string>,
) {
  const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "");
  if (name === "textAlign" || kebab === "text-align") {
    if (/^(left|right)$/i.test(value)) {
      pushFinding(findings, seen, {
        kind: "physical-value",
        property: name,
        value,
        line,
        column,
        message: `${file}:${line}:${column} ${name}:${value} can become ${value.toLowerCase() === "left" ? "start" : "end"}`,
      });
    }
    return;
  }
  if ((name === "float" || kebab === "float") && /^(left|right)$/i.test(value)) {
    pushFinding(findings, seen, {
      kind: "manual-review",
      property: name,
      value,
      line,
      column,
      message: `${file}:${line}:${column} float:${value} requires logical layout review`,
    });
    return;
  }
  if ((name === "transform" || kebab === "transform") && /translateX\(/i.test(value)) {
    pushFinding(findings, seen, {
      kind: "manual-review",
      property: name,
      value,
      line,
      column,
      message: `${file}:${line}:${column} horizontal transform requires direction review`,
    });
    return;
  }
  if ((kebab === "background" || kebab === "background-image") && /linear-gradient\s*\([^)]*\bto\s+(left|right)\b/i.test(value)) {
    pushFinding(findings, seen, {
      kind: "manual-review",
      property: name,
      value,
      line,
      column,
      message: `${file}:${line}:${column} directional gradient requires direction review`,
    });
    return;
  }
  if ((name === "boxShadow" || kebab === "box-shadow") && /^\s*-?\d+(?:px|rem|em)/i.test(value)) {
    pushFinding(findings, seen, {
      kind: "manual-review",
      property: name,
      value,
      line,
      column,
      message: `${file}:${line}:${column} horizontal shadow offset may need direction review`,
    });
    return;
  }
  if (isFourValuePhysical(kebab, value)) {
    pushFinding(findings, seen, {
      kind: "manual-review",
      property: name,
      value,
      line,
      column,
      message: `${file}:${line}:${column} four-value ${kebab} is physical and requires direction review`,
    });
  }
}

/** Parse JS/TS/JSX with Babel and report physical style keys. Returns null if the file cannot be parsed. */
export function analyzeJsAst(source: string, file: string): CssFinding[] | null {
  const ast = parseSource(source);
  if (!ast) return null;
  const bindings = new Map<string, BabelNode>();
  walk(ast, [], (node) => {
    if (node.type !== "VariableDeclarator") return;
    const id = node.id as BabelNode | undefined;
    const init = node.init as BabelNode | undefined;
    if (id?.type === "Identifier" && init?.type === "ObjectExpression") bindings.set(String(id.name), init);
  });
  const findings: CssFinding[] = [];
  const seen = new Set<string>();
  const reportStyleProperty = (node: BabelNode, ancestors: readonly BabelNode[]) => {
    if ((node.type !== "ObjectProperty" && node.type !== "ObjectMethod") || (node.computed && (node.key as BabelNode | undefined)?.type !== "StringLiteral")) return;
    const name = propertyName(node);
    if (!name || inTypeContext(ancestors) || !inStyleContext(ancestors)) return;
    const line = node.loc?.start.line ?? 1;
    const column = (node.loc?.start.column ?? 0) + 1;
    const valueText = stringValue(objectValueNode(node)) ?? name;
    if (CAMEL_TO_KEBAB[name] || KEBAB_SAFE[name]) {
      pushFinding(findings, seen, {
        kind: "physical-property",
        property: name,
        replacement: CAMEL_TO_KEBAB[name] ?? KEBAB_SAFE[name],
        value: name,
        line,
        column,
        message: `${file}:${line}:${column} ${name} in a style object can become ${CAMEL_TO_KEBAB[name] ?? KEBAB_SAFE[name]}`,
      });
    } else if (POSITIONING[name]) {
      pushFinding(findings, seen, {
        kind: "manual-review",
        property: name,
        replacement: POSITIONING[name],
        value: name,
        line,
        column,
        message: `${file}:${line}:${column} ${name} in a style object is physical positioning and requires direction review`,
      });
    }
    if (typeof valueText === "string") reviewObjectValue(file, name, valueText, line, column, findings, seen);
  };
  walk(ast, [], (node, ancestors) => {
    const line = node.loc?.start.line ?? 1;
    const column = (node.loc?.start.column ?? 0) + 1;
    reportStyleProperty(node, ancestors);
    if (node.type === "SpreadElement" && inStyleContext(ancestors)) {
      const argument = node.argument as BabelNode | undefined;
      const bound = argument?.type === "Identifier" ? bindings.get(String(argument.name)) : undefined;
      for (const property of (bound?.properties as BabelNode[] | undefined) ?? []) {
        reportStyleProperty(property, [...ancestors, bound!]);
      }
    }
    if (node.type === "JSXAttribute") {
      const name = (node.name as BabelNode | undefined)?.name;
      const value = node.value as BabelNode | undefined;
      if (name === "dir" && value?.type === "StringLiteral" && value.value === "ltr") {
        pushFinding(findings, seen, {
          kind: "manual-review",
          value: "dir=\"ltr\"",
          line,
          column,
          message: `${file}:${line}:${column} hard-coded dir=\"ltr\" requires direction review`,
        });
      }
    }
    if (node.type === "MemberExpression") {
      const property = node.property as BabelNode | undefined;
      if (property?.name === "scrollLeft" && !node.computed) {
        pushFinding(findings, seen, {
          kind: "manual-review",
          value: "directional browser interaction",
          line,
          column,
          message: `${file}:${line}:${column} directional browser interaction requires logical normalization`,
        });
      }
    }
    const arrowName = node.type === "StringLiteral"
      ? String(node.value ?? "")
      : node.type === "Identifier"
        ? String(node.name ?? "")
        : "";
    if (/^Arrow(?:Left|Right)$/.test(arrowName)) {
      pushFinding(findings, seen, {
        kind: "manual-review",
        value: "directional browser interaction",
        line,
        column,
        message: `${file}:${line}:${column} directional browser interaction requires logical normalization`,
      });
    }
  });
  return findings;
}

/** Semantics-preserving object-key/value edits. Does not rewrite left/right positioning. */
export function safeJsStyleEdits(source: string): JsEdit[] | null {
  const ast = parseSource(source);
  if (!ast) return null;
  const edits: JsEdit[] = [];
  walk(ast, [], (node, ancestors) => {
    if (node.type !== "ObjectProperty" || (node.computed && (node.key as BabelNode | undefined)?.type !== "StringLiteral") || inTypeContext(ancestors) || !inStyleContext(ancestors)) return;
    const key = node.key as BabelNode | undefined;
    const name = propertyName(node);
    if (!name || !key || typeof key.start !== "number" || typeof key.end !== "number") return;
    if (CAMEL_SAFE[name]) {
      edits.push({ start: key.start, end: key.end, text: CAMEL_SAFE[name] });
    } else if (KEBAB_SAFE[name] && key.type === "StringLiteral") {
      edits.push({ start: key.start, end: key.end, text: JSON.stringify(KEBAB_SAFE[name]) });
    }
    const value = objectValueNode(node);
    if ((name === "textAlign" || name === "text-align") && value?.type === "StringLiteral" && typeof value.start === "number" && typeof value.end === "number") {
      const text = String(value.value ?? "");
      if (/^left$/i.test(text)) edits.push({ start: value.start, end: value.end, text: '"start"' });
      if (/^right$/i.test(text)) edits.push({ start: value.start, end: value.end, text: '"end"' });
    }
  });
  return edits;
}
