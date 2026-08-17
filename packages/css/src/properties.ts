/** Safe mechanical kebab replacements. Positioning stays review-only. */
export const KEBAB_SAFE: Record<string, string> = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-left-style": "border-inline-start-style",
  "border-right-style": "border-inline-end-style",
  "scroll-margin-left": "scroll-margin-inline-start",
  "scroll-margin-right": "scroll-margin-inline-end",
  "scroll-padding-left": "scroll-padding-inline-start",
  "scroll-padding-right": "scroll-padding-inline-end",
};

export const CAMEL_SAFE: Record<string, string> = {
  marginLeft: "marginInlineStart",
  marginRight: "marginInlineEnd",
  paddingLeft: "paddingInlineStart",
  paddingRight: "paddingInlineEnd",
  borderLeft: "borderInlineStart",
  borderRight: "borderInlineEnd",
  borderLeftWidth: "borderInlineStartWidth",
  borderRightWidth: "borderInlineEndWidth",
  borderLeftColor: "borderInlineStartColor",
  borderRightColor: "borderInlineEndColor",
  borderLeftStyle: "borderInlineStartStyle",
  borderRightStyle: "borderInlineEndStyle",
  scrollMarginLeft: "scrollMarginInlineStart",
  scrollMarginRight: "scrollMarginInlineEnd",
  scrollPaddingLeft: "scrollPaddingInlineStart",
  scrollPaddingRight: "scrollPaddingInlineEnd",
};

export const POSITIONING: Record<string, string> = {
  left: "inset-inline-start",
  right: "inset-inline-end",
};

export const CAMEL_TO_KEBAB: Record<string, string> = {
  marginLeft: "margin-inline-start",
  marginRight: "margin-inline-end",
  paddingLeft: "padding-inline-start",
  paddingRight: "padding-inline-end",
  borderLeft: "border-inline-start",
  borderRight: "border-inline-end",
  borderLeftWidth: "border-inline-start-width",
  borderRightWidth: "border-inline-end-width",
  borderLeftColor: "border-inline-start-color",
  borderRightColor: "border-inline-end-color",
  borderLeftStyle: "border-inline-start-style",
  borderRightStyle: "border-inline-end-style",
  scrollMarginLeft: "scroll-margin-inline-start",
  scrollMarginRight: "scroll-margin-inline-end",
  scrollPaddingLeft: "scroll-padding-inline-start",
  scrollPaddingRight: "scroll-padding-inline-end",
  textAlign: "text-align:start/end",
};

const FOUR_VALUE = new Set(["padding", "margin", "inset", "scroll-padding", "scroll-margin", "border-radius"]);

export function splitCssList(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const character of value) {
    if (character === "(") depth++;
    else if (character === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(character)) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function isFourValuePhysical(property: string, value: string): boolean {
  return FOUR_VALUE.has(property.toLowerCase()) && splitCssList(value)[3] !== undefined;
}
