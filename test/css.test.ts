import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import postcss from "postcss";
import { analyzeCss, analyzeSource, extractCssTaggedTemplates, logicalPropertiesPlugin, migrateCss, migrateSource } from "@rtl-resolver/css";

const fixture = (relative: string) => readFileSync(resolve(process.cwd(), "test/fixtures/lint", relative), "utf8");

describe("CSS analysis and migration", () => {
  it("extracts styled-components and Emotion tagged templates", () => {
    const source = fixture("css-in-js/Box.tsx");
    const templates = extractCssTaggedTemplates(source);
    expect(templates).toHaveLength(2);
    const findings = analyzeSource(source, "Box.tsx");
    expect(findings.some((finding) => finding.property === "margin-left")).toBe(true);
    expect(findings.some((finding) => finding.property === "padding-right")).toBe(true);
    expect(findings.some((finding) => finding.property === "left")).toBe(true);
    expect(findings.some((finding) => finding.property === "text-align")).toBe(true);
    expect(findings.some((finding) => finding.property === "float")).toBe(true);
    expect(findings.some((finding) => finding.property === "transform")).toBe(true);
  });

  it("does not rewrite left/right during migrate and is idempotent", () => {
    const source = fixture("dirty/app.css");
    const first = migrateCss(source);
    expect(first.output).toContain("margin-inline-start");
    expect(first.output).toContain("text-align: start");
    expect(first.output).toContain("right: 0");
    const second = migrateCss(first.output);
    expect(second.changed).toBe(0);
    expect(second.output).toBe(first.output);
  });

  it("transforms safe PostCSS declarations without touching positioning", () => {
    const decls = [
      { prop: "margin-left", value: "1rem" },
      { prop: "left", value: "0" },
      { prop: "text-align", value: "left" },
    ];
    const root = { walkDecls(callback: (decl: { prop: string; value: string }) => void) { decls.forEach(callback); } };
    logicalPropertiesPlugin().Once(root);
    expect(decls[0].prop).toBe("margin-inline-start");
    expect(decls[1].prop).toBe("left");
    expect(decls[2].value).toBe("start");
    logicalPropertiesPlugin().Once(root);
    expect(decls[0].prop).toBe("margin-inline-start");
    expect(decls[2].value).toBe("start");
  });

  it("preserves valid source-map provenance through the PostCSS transform", async () => {
    const result = await postcss([logicalPropertiesPlugin()]).process(
      ".card { margin-left: 1rem; text-align: right; left: 0; }",
      { from: "input.css", to: "output.css", map: { inline: false, annotation: false } },
    );
    expect(result.css).toContain("margin-inline-start: 1rem");
    expect(result.css).toContain("text-align: end");
    expect(result.css).toContain("left: 0");
    const map = result.map?.toJSON();
    expect(map?.sources).toEqual(["input.css"]);
    expect(map?.mappings.length).toBeGreaterThan(0);
  });

  it("keeps clean logical CSS finding-free", () => {
    expect(analyzeCss(fixture("clean/app.css"), "app.css")).toEqual([]);
    expect(analyzeSource(fixture("clean/Button.tsx"), "Button.tsx")).toEqual([]);
  });

  it("flags css() objects but not TypeScript type literals", () => {
    const findings = analyzeSource(fixture("css-in-js/Objects.tsx"), "Objects.tsx");
    expect(findings.some((finding) => finding.property === "marginLeft")).toBe(true);
    expect(findings.filter((finding) => finding.property === "left")).toHaveLength(1);
    expect(findings.some((finding) => finding.property === "right")).toBe(false);
  });

  it("understands CSS Modules :export and composes without treating class names as properties", () => {
    const findings = analyzeCss(fixture("css-modules/Button.module.css"), "Button.module.css");
    expect(findings.some((finding) => finding.property === "margin-left")).toBe(true);
    expect(findings.some((finding) => finding.property === "left" && finding.kind === "manual-review")).toBe(true);
    expect(findings.some((finding) => finding.value === "startToken")).toBe(false);
    expect(findings.some((finding) => finding.value === "importedLeft")).toBe(false);
    expect(findings.some((finding) => /composes/i.test(finding.message))).toBe(false);
    expect(findings.some((finding) => finding.value === "start-token")).toBe(false);
    expect(findings.filter((finding) => finding.property === "left")).toHaveLength(1);
    expect(findings.some((finding) => /four-value padding/.test(finding.message))).toBe(true);
  });

  it("does not migrate ICSS chrome in CSS Modules", () => {
    const source = fixture("css-modules/Button.module.css");
    const result = migrateCss(source, "Button.module.css");
    expect(result.output).toContain("left: startToken");
    expect(result.output).toContain("left: importedLeft");
    expect(result.output).toContain("@value left: start-token");
    expect(result.output).toContain("composes: left from global");
    expect(result.output).toContain(".left {");
    expect(result.output).toContain("margin-inline-start: 1rem");
    expect(result.output).toContain("left: 0");
    expect(result.output).toContain("padding: 1px 2px 3px 4px");
  });

  it("analyzes css() callbacks, css props, kebab keys, and style() objects", () => {
    const findings = analyzeSource(fixture("css-in-js/Semantics.tsx"), "Semantics.tsx");
    expect(findings.some((finding) => finding.property === "margin-left")).toBe(true);
    expect(findings.some((finding) => finding.property === "padding-right")).toBe(true);
    expect(findings.some((finding) => finding.property === "paddingLeft")).toBe(true);
    expect(findings.some((finding) => finding.property === "marginLeft")).toBe(true);
    expect(findings.some((finding) => finding.property === "textAlign")).toBe(true);
    expect(findings.some((finding) => finding.property === "transform")).toBe(true);
    expect(findings.some((finding) => finding.property === "float")).toBe(true);
    expect(findings.some((finding) => /four-value padding/.test(finding.message))).toBe(true);
    expect(findings.filter((finding) => finding.property === "left").length).toBeGreaterThanOrEqual(2);
    expect(findings.some((finding) => finding.property === "right" && finding.kind === "manual-review" && finding.message.includes("style object"))).toBe(false);
  });

  it("migrates tagged templates and style objects without rewriting positioning or types", () => {
    const source = fixture("css-in-js/Semantics.tsx");
    const first = migrateSource(source, "Semantics.tsx");
    expect(first.output).toContain("margin-inline-start: ${\"1rem\"}");
    expect(first.output).toContain("padding-inline-end: 8px");
    expect(first.output).toContain("marginInlineStart: 2");
    expect(first.output).toContain("paddingInlineStart: 4");
    expect(first.output).toContain('"margin-inline-start": "1rem"');
    expect(first.output).toContain('textAlign: "start"');
    expect(first.output).toContain("left: 0");
    expect(first.output).toContain("type Pos = { left: number; right: number }");
    expect(first.output).toContain("padding: \"1px 2px 3px 4px\"");
    const second = migrateSource(first.output, "Semantics.tsx");
    expect(second.changed).toBe(0);
    expect(second.output).toBe(first.output);
  });

  it("follows same-file object spreads and computed string keys", () => {
    const source = `
      const physical = { marginLeft: 8 };
      export const box = css({ ...physical, ["padding-right"]: 4 });
    `;
    const findings = analyzeSource(source, "Spread.tsx");
    expect(findings.some((finding) => finding.property === "marginLeft")).toBe(true);
    expect(findings.some((finding) => finding.property === "padding-right")).toBe(true);
  });
});
