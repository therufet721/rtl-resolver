export const ruleName = "rtl-resolver/no-physical-direction";

const PHYSICAL = new Set([
  "margin-left", "margin-right", "padding-left", "padding-right",
  "left", "right", "border-left", "border-right",
]);

const SAFE_FIXES: Record<string, string> = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
};

function parentSelector(decl: { parent?: { selector?: string; type?: string } }): string {
  return String(decl.parent?.selector ?? "");
}

function isCssModulesChrome(decl: { prop: string; parent?: { selector?: string } }): boolean {
  if (decl.prop.toLowerCase() === "composes") return true;
  return /:export\b|:import\b/.test(parentSelector(decl));
}

export function noPhysicalDirection(ruleName: string, _primary: unknown, _secondary: unknown, context: { fix?: boolean; utils?: { report(args: unknown): void } }) {
  const fix = Boolean(context?.fix);
  return (root: { walkDecls(callback: (decl: { prop: string; value: string; parent?: { selector?: string } }) => void): void }, result: { warn(message: string, extra?: unknown): void }) => {
    root.walkDecls((decl) => {
      if (isCssModulesChrome(decl)) return;
      const property = decl.prop.toLowerCase();
      const directionalVisual = property === "transform" && /translateX\(/i.test(decl.value)
        || (property === "background" || property === "background-image") && /to\s+(left|right)\b/i.test(decl.value);
      const directionalShadow = property === "box-shadow" && /^\s*-?\d+(?:px|rem|em)/i.test(decl.value);
      if (fix && SAFE_FIXES[property]) {
        decl.prop = SAFE_FIXES[property];
        return;
      }
      if (fix && property === "text-align" && /^(left|right)$/i.test(decl.value.trim())) {
        decl.value = decl.value.trim().toLowerCase() === "left" ? "start" : "end";
        return;
      }
      if (!PHYSICAL.has(property) && !directionalVisual && !directionalShadow && !(property === "text-align" && /^(left|right)$/i.test(decl.value.trim()))) return;
      const message = directionalVisual
        ? `${decl.prop} contains a physical direction; review RTL behavior`
        : directionalShadow
          ? `${decl.prop} has a horizontal offset; review RTL behavior`
          : property === "text-align"
            ? `${decl.prop}:${decl.value.trim()} can become ${decl.value.trim().toLowerCase() === "left" ? "start" : "end"}`
            : `${decl.prop} can break RTL; prefer a logical property`;
      if (context?.utils?.report) context.utils.report({ message, node: decl, result, ruleName });
      else result.warn(message, { node: decl, rule: ruleName });
    });
  };
}

/** Stylelint `createPlugin` compatible export. Pass stylelint.createPlugin when the peer is installed. */
export function createPlugin(
  create: (name: string, rule: (primary: unknown, secondary: unknown, context: { fix?: boolean; utils?: { report(args: unknown): void } }) => ReturnType<typeof noPhysicalDirection>) => unknown = (name, rule) => ({ ruleName: name, rule }),
) {
  return create(ruleName, (primary, secondary, context) => noPhysicalDirection(ruleName, primary, secondary, context));
}

export default {
  rules: { "no-physical-direction": noPhysicalDirection },
  createPlugin,
  ruleName,
};
