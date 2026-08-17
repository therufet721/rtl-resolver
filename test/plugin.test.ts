import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateRTLPlugin } from "@rtl-resolver/core/plugin";

describe("RTL plugins", () => {
  it("rejects plugins that cannot audit or migrate", () => {
    expect(validateRTLPlugin({})).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: "error", message: "plugin.name is required" }),
    ]));
    expect(validateRTLPlugin({ name: "empty" }).some((item) => item.level === "error")).toBe(true);
  });

  it("accepts v1 audit/migrate plugins", () => {
    const diagnostics = validateRTLPlugin({
      name: "ok",
      version: "0.1.0",
      audit: () => [],
      migrate: () => [],
    });
    expect(diagnostics.filter((item) => item.level === "error")).toEqual([]);
  });

  it("loads the fixture plugin and reports during lint", () => {
    const result = spawnSync(process.execPath, ["packages/cli/dist/cli.js", "lint", "test/fixtures/plugin-project"], {
      encoding: "utf8",
    });
    expect(result.stdout + result.stderr).toMatch(/fixture-plugin/);
    expect(result.status).toBe(1);
  });

  it("runs plugin migrate hooks in dry-run", () => {
    const result = spawnSync(process.execPath, ["packages/cli/dist/cli.js", "migrate", "test/fixtures/plugin-project", "--report"], {
      encoding: "utf8",
    });
    expect(result.stdout + result.stderr).toMatch(/rewrote fixture CSS/);
    expect(result.status).toBe(0);
  });
});
