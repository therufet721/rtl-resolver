import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  assertBidiEngineExports,
  assertPublishedSubpathsResolve,
  assertTsupEntriesAreExported,
} from "../scripts/check-package-exports.mjs";
import { publishOrder, type WorkspacePackage } from "../scripts/workspaces.mjs";

function publishedNames(): string[] {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      'import { publishOrder } from "./scripts/workspaces.mjs"; process.stdout.write(JSON.stringify(publishOrder().map((pkg) => pkg.manifest.name)))',
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "publishOrder() failed");
  }
  return JSON.parse(result.stdout) as string[];
}

describe("workspace publish order", () => {
  it("publishes core before dependents and the root package last", () => {
    const names = publishedNames();
    expect(names).toHaveLength(17);
    expect(names.indexOf("@rtl-resolver/core")).toBeLessThan(names.indexOf("@rtl-resolver/react"));
    expect(names.indexOf("@rtl-resolver/core")).toBeLessThan(names.indexOf("@rtl-resolver/css"));
    expect(names.indexOf("@rtl-resolver/core")).toBeLessThan(names.indexOf("@rtl-resolver/next"));
    expect(names.indexOf("@rtl-resolver/css")).toBeLessThan(names.indexOf("@rtl-resolver/cli"));
    expect(names.indexOf("@rtl-resolver/react")).toBeLessThan(names.indexOf("@rtl-resolver/mui"));
    expect(names.indexOf("@rtl-resolver/adapters")).toBeLessThan(names.indexOf("@rtl-resolver/radix"));
    expect(names.at(-1)).toBe("rtl-resolver");
  });

  it("refuses a bare npm publish unless RTL_RELEASE is set", () => {
    const env = { ...process.env };
    delete env.RTL_RELEASE;
    const blocked = spawnSync(process.execPath, ["scripts/prepublish-guard.mjs"], {
      encoding: "utf8",
      env,
    });
    expect(blocked.status).toBe(1);
    const allowed = spawnSync(process.execPath, ["scripts/prepublish-guard.mjs"], {
      encoding: "utf8",
      env: { ...env, RTL_RELEASE: "1" },
    });
    expect(allowed.status).toBe(0);
  });

  it("ships LICENSE, public access, and repo metadata on every package", () => {
    for (const pkg of publishOrder()) {
      expect(pkg.manifest.publishConfig?.access).toBe("public");
      expect(pkg.manifest.repository?.url).toContain("rtl-resolver.git");
      expect(pkg.manifest.homepage).toContain("github.com/therufet721/rtl-resolver");
      expect(pkg.manifest.bugs?.url).toContain("github.com/therufet721/rtl-resolver/issues");
      if (pkg.manifest.exports) {
        expect(pkg.manifest.exports["./package.json"]).toBe("./package.json");
      }
      const directory = pkg.root ? "." : pkg.path.replace(/\/package\.json$/, "");
      expect(existsSync(`${directory}/LICENSE`)).toBe(true);
    }
    expect(
      publishOrder()
        .filter((pkg: WorkspacePackage) => !pkg.root)
        .every((pkg: WorkspacePackage) => pkg.manifest.repository?.directory?.startsWith("packages/")),
    ).toBe(true);
  });

  it("advertises the tested Node floor on every package", () => {
    for (const pkg of publishOrder()) {
      expect(pkg.manifest.engines?.node).toBe(">=20");
    }
  });

  it("keeps the release workflow's dirty-tree guard enabled", () => {
    expect(readFileSync(".github/workflows/release.yml", "utf8")).not.toContain("--allow-dirty");
  });

  it("exports every tsup library entry as a package subpath", () => {
    expect(assertTsupEntriesAreExported()).toEqual([]);
  });

  it("declares core and root bidi and plugin subpaths", () => {
    const core = JSON.parse(readFileSync("packages/core/package.json", "utf8"));
    const root = JSON.parse(readFileSync("package.json", "utf8"));
    const bidi = {
      types: "./dist/bidi/index.d.ts",
      import: "./dist/bidi/index.js",
      require: "./dist/bidi/index.cjs",
    };
    const plugin = {
      types: "./dist/plugin/index.d.ts",
      import: "./dist/plugin/index.js",
      require: "./dist/plugin/index.cjs",
    };
    expect(core.exports["./bidi"]).toEqual(bidi);
    expect(root.exports["./bidi"]).toEqual(bidi);
    expect(core.exports["./plugin"]).toEqual(plugin);
    expect(root.exports["./plugin"]).toEqual(plugin);
  });

  it.skipIf(!existsSync("packages/core/dist/bidi/index.js") || !existsSync("dist/bidi/index.js"))(
    "resolves every declared subpath from built dist through Node",
    () => {
      expect(assertPublishedSubpathsResolve()).toEqual([]);
      expect(assertBidiEngineExports()).toEqual([]);
    },
  );

  it("marks duck-typed PostCSS and Stylelint peers optional", () => {
    const css = JSON.parse(readFileSync("packages/css/package.json", "utf8"));
    const stylelint = JSON.parse(readFileSync("packages/stylelint/package.json", "utf8"));
    expect(css.peerDependenciesMeta.postcss.optional).toBe(true);
    expect(stylelint.peerDependenciesMeta.stylelint.optional).toBe(true);
  });

  it("workspace packages inherit root path mappings except core", () => {
    for (const pkg of publishOrder().filter((item) => !item.root)) {
      const tsconfig = JSON.parse(readFileSync(`packages/${pkg.name}/tsconfig.json`, "utf8")) as { extends?: string };
      if (pkg.manifest.name === "@rtl-resolver/core") {
        expect(tsconfig.extends).toBe("../../tsconfig.base.json");
        continue;
      }
      expect(tsconfig.extends, pkg.manifest.name).toBe("../../tsconfig.json");
    }
  });

  it("emits a use client banner from React overlay package builds", () => {
    for (const name of ["react", "mui", "radix", "headless-ui"]) {
      expect(readFileSync(`packages/${name}/tsup.config.ts`, "utf8")).toContain('"use client"');
    }
    expect(readFileSync("packages/next/tsup.config.ts", "utf8")).not.toContain('"use client"');
  });
});
