import { describe, expect, it } from "vitest";
import { noPhysicalDirection } from "@rtl-resolver/stylelint";

describe("stylelint no-physical-direction", () => {
  function run(decls: Array<{ prop: string; value: string; parent?: { selector?: string } }>, fix = false): string[] {
    const warnings: string[] = [];
    const rule = noPhysicalDirection("no-physical-direction", null, null, { fix });
    rule(
      { walkDecls(callback: (decl: { prop: string; value: string; parent?: { selector?: string } }) => void) { decls.forEach(callback); } },
      { warn(message: string) { warnings.push(message); } },
    );
    return warnings;
  }

  it("reports physical properties, transforms, gradients, and shadows", () => {
    const warnings = run([
      { prop: "margin-left", value: "1rem" },
      { prop: "transform", value: "translateX(8px)" },
      { prop: "background", value: "linear-gradient(to right, red, blue)" },
      { prop: "box-shadow", value: "2px 0 0 black" },
      { prop: "margin-inline-start", value: "1rem" },
    ]);
    expect(warnings).toHaveLength(4);
    expect(warnings[0]).toContain("margin-left");
    expect(warnings[1]).toContain("physical direction");
    expect(warnings[2]).toContain("physical direction");
    expect(warnings[3]).toContain("horizontal offset");
  });

  it("is idempotent for the same declarations", () => {
    const decls = [{ prop: "padding-right", value: "8px" }];
    expect(run(decls)).toEqual(run(decls));
  });

  it("autofixes safe properties and text-align without rewriting left/right", () => {
    const decls = [
      { prop: "margin-left", value: "1rem" },
      { prop: "left", value: "0" },
      { prop: "text-align", value: "left" },
      { prop: "padding-right", value: "8px" },
    ];
    expect(run(decls, true)).toEqual(["left can break RTL; prefer a logical property"]);
    expect(decls.map((decl) => `${decl.prop}:${decl.value}`)).toEqual([
      "margin-inline-start:1rem",
      "left:0",
      "text-align:start",
      "padding-inline-end:8px",
    ]);
  });

  it("ignores CSS Modules :export and composes chrome", () => {
    expect(run([{ prop: "left", value: "startToken", parent: { selector: ":export" } }])).toEqual([]);
    expect(run([{ prop: "left", value: "importedLeft", parent: { selector: ":import" } }])).toEqual([]);
    expect(run([{ prop: "composes", value: "left from './sides.module.css'" }])).toEqual([]);
  });

  it("exposes a stylelint.createPlugin-compatible factory", async () => {
    const { createPlugin, ruleName } = await import("@rtl-resolver/stylelint");
    const plugin = createPlugin();
    expect(ruleName).toBe("rtl-resolver/no-physical-direction");
    expect(plugin).toMatchObject({ ruleName });
  });
});
