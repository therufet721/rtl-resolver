import { describe, expect, it } from "vitest";
import { rules } from "@rtl-resolver/eslint";

describe("eslint rules", () => {
  function lint(ruleName: keyof typeof rules, source: string, ast: Record<string, unknown> = {}): string[] {
    const messages: string[] = [];
    const context = {
      getSourceCode() { return { text: source }; },
      report({ message }: { message: string }) { messages.push(message); },
    };
    const listeners = rules[ruleName].create(context) as Record<string, (node: unknown) => void>;
    if (ast.Property && listeners.Property) listeners.Property(ast.Property);
    if (ast.JSXAttribute && listeners.JSXAttribute) listeners.JSXAttribute(ast.JSXAttribute);
    if (listeners.Program) listeners.Program({});
    return messages;
  }

  it("flags physical style object properties", () => {
    const messages = lint("no-physical-direction", "", { Property: { key: { name: "marginLeft" } } });
    expect(messages[0]).toContain("marginLeft");
  });

  it("flags hard-coded dir and directional browser APIs", () => {
    expect(lint("no-directional-assumptions", `element.scrollLeft = 0;`)[0]).toContain("scrolling");
    expect(lint("no-directional-assumptions", `<div dir="ltr" />`)[0]).toContain("dir=\"ltr\"");
  });

  it("requires an icon policy for directional icon names", () => {
    expect(lint("no-unmirrored-icons", `const name = "arrow-forward";`)[0]).toContain("mirroring policy");
    expect(lint("no-unmirrored-icons", `shouldMirrorIcon("arrow-forward", "rtl")`)).toEqual([]);
  });
});
