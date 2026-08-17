const PHYSICAL = new Set(["marginLeft", "marginRight", "paddingLeft", "paddingRight", "left", "right", "textAlign"]);
const noPhysicalDirection = {
  meta: { type: "suggestion", docs: { description: "Prefer direction-safe logical properties" }, schema: [] },
  create(context: any) {
    return {
      Property(node: any) {
        const name = node.key?.name ?? node.key?.value;
        if (typeof name === "string" && PHYSICAL.has(name)) {
          context.report({ node, message: `Prefer a logical direction property instead of ${name}.` });
        }
      },
      JSXAttribute(node: any) {
        const name = node.name?.name;
        if (name === "dir" && node.value?.value === "ltr") {
          context.report({ node, message: "Avoid hard-coding dir=\"ltr\" when direction can be resolved." });
        }
      },
    };
  },
};
const noDirectionalAssumptions = {
  meta: { type: "suggestion", docs: { description: "Normalize browser and content direction assumptions" }, schema: [] },
  create(context: any) {
    return {
      Program(node: any) {
        const source = context.getSourceCode().text;
        if (/\bscrollLeft\b|\bArrow(?:Left|Right)\b/.test(source)) {
          context.report({ node, message: "Normalize directional scrolling and keyboard input with @rtl-resolver/browser." });
        }
        if (/\bdir\s*=\s*["']ltr["']/.test(source)) {
          context.report({ node, message: "Avoid hard-coded dir=\"ltr\"; derive direction at the boundary." });
        }
      },
    };
  },
};
const noUnmirroredIcons = {
  meta: { type: "suggestion", docs: { description: "Require explicit policies for directional icons" }, schema: [] },
  create(context: any) {
    return {
      Program(node: any) {
        const source = context.getSourceCode().text;
        if (/["'`](?:arrow-forward|arrow-back|chevron-start|chevron-end|undo|redo)["'`]/.test(source)
          && !/\b(?:iconAttributes|shouldMirrorIcon|iconPolicy|requiresIconPolicy)\b/.test(source)) {
          context.report({ node, message: "Directional icons need an explicit @rtl-resolver/icons mirroring policy." });
        }
      },
    };
  },
};
export const rules = { "no-physical-direction": noPhysicalDirection, "no-directional-assumptions": noDirectionalAssumptions, "no-unmirrored-icons": noUnmirroredIcons };
export const configs = { recommended: { plugins: ["@rtl-resolver"], rules: {
  "@rtl-resolver/no-physical-direction": "warn",
  "@rtl-resolver/no-directional-assumptions": "warn",
  "@rtl-resolver/no-unmirrored-icons": "warn",
} } };
export const flatRecommended = {
  plugins: { "@rtl-resolver": { rules } },
  rules: configs.recommended.rules,
};
export default { rules, configs, flatRecommended };
