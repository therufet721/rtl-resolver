#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publishOrder, root } from "./workspaces.mjs";

/** Map a tsup entry key to the package exports subpath, or null if it is bin-only. */
export function tsupEntryToSubpath(entry) {
  if (entry === "cli") return null;
  if (entry === "index") return ".";
  return `./${entry.replace(/\/index$/, "")}`;
}

export function tsupEntryKeys(tsupSource) {
  const block = tsupSource.match(/entry:\s*\{([^}]+)\}/);
  if (!block) return [];
  return [...block[1].matchAll(/["']?([\w./-]+)["']?\s*:/g)].map((match) => match[1]);
}

export function exportSpecifiers(pkg) {
  const exportsMap = pkg.manifest.exports;
  if (!exportsMap || typeof exportsMap !== "object") return [];
  return Object.keys(exportsMap).map((subpath) => ({
    subpath,
    specifier: subpath === "." ? pkg.manifest.name : `${pkg.manifest.name}${subpath.slice(1)}`,
    target: exportsMap[subpath],
  }));
}

function packageDirectory(pkg) {
  return pkg.root ? root : dirname(pkg.path);
}

export function assertTsupEntriesAreExported(packages = publishOrder()) {
  const failures = [];
  for (const pkg of packages) {
    const tsupPath = join(packageDirectory(pkg), "tsup.config.ts");
    if (!existsSync(tsupPath)) continue;
    const keys = tsupEntryKeys(readFileSync(tsupPath, "utf8"));
    for (const key of keys) {
      const subpath = tsupEntryToSubpath(key);
      if (!subpath) continue;
      if (!pkg.manifest.exports?.[subpath]) {
        failures.push(`${pkg.manifest.name}: tsup entry "${key}" is not in exports["${subpath}"]`);
      }
    }
  }
  return failures;
}

function conditionPath(target, condition) {
  if (typeof target === "string") return target;
  if (!target || typeof target !== "object") return undefined;
  return target[condition];
}

function spawnResolve(specifier, kind) {
  const args =
    kind === "require"
      ? ["-e", "process.stdout.write(require.resolve(process.argv[1]))", specifier]
      : [
          "--input-type=module",
          "-e",
          "const spec = process.argv[1]; const resolved = import.meta.resolve(spec); process.stdout.write(typeof resolved?.then === 'function' ? await resolved : resolved);",
          specifier,
        ];
  return spawnSync(process.execPath, args, { encoding: "utf8", cwd: root });
}

function spawnImport(specifier) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const spec = process.argv[1]; const mod = await import(spec); process.stdout.write(JSON.stringify(Object.keys(mod)));",
      specifier,
    ],
    { encoding: "utf8", cwd: root },
  );
}

export function assertPublishedSubpathsResolve(packages = publishOrder()) {
  const failures = [];
  for (const pkg of packages) {
    for (const { subpath, specifier, target } of exportSpecifiers(pkg)) {
      const directory = packageDirectory(pkg);
      const importPath = subpath === "./package.json" ? "./package.json" : conditionPath(target, "import");
      const requirePath = subpath === "./package.json" ? "./package.json" : conditionPath(target, "require");
      const typesPath = subpath === "./package.json" ? undefined : conditionPath(target, "types");

      for (const [label, relative] of [
        ["import", importPath],
        ["require", requirePath],
        ["types", typesPath],
      ]) {
        if (!relative) {
          if (label !== "types" && subpath !== "./package.json") {
            failures.push(`${specifier}: exports["${subpath}"] is missing "${label}"`);
          }
          continue;
        }
        if (!existsSync(join(directory, relative))) {
          failures.push(`${specifier}: missing ${label} file ${relative}`);
        }
      }

      const esm = spawnResolve(specifier, "import");
      if (esm.status !== 0) {
        failures.push(`${specifier}: import.meta.resolve failed\n${esm.stderr || esm.stdout}`);
      }
      if (requirePath) {
        const cjs = spawnResolve(specifier, "require");
        if (cjs.status !== 0) {
          failures.push(`${specifier}: require.resolve failed\n${cjs.stderr || cjs.stdout}`);
        }
      }
    }
  }
  return failures;
}

const BIDI_EXPORTS = [
  "analyzeBidi",
  "reorderBidi",
  "resolveBidiLevels",
  "bidiClassName",
  "bidiClassOf",
  "mirroredCodePoint",
];

export function assertBidiEngineExports() {
  const failures = [];
  for (const specifier of ["@rtl-resolver/core/bidi", "rtl-resolver/bidi"]) {
    const result = spawnImport(specifier);
    if (result.status !== 0) {
      failures.push(`${specifier}: ${result.stderr || result.stdout}`);
      continue;
    }
    const keys = new Set(JSON.parse(result.stdout));
    for (const name of BIDI_EXPORTS) {
      if (!keys.has(name)) failures.push(`${specifier}: missing export ${name}`);
    }
  }
  return failures;
}

function runCli() {
  const failures = [
    ...assertTsupEntriesAreExported(),
    ...assertPublishedSubpathsResolve(),
    ...assertBidiEngineExports(),
  ];
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  const specs = publishOrder().flatMap(exportSpecifiers).map((item) => item.specifier);
  console.log(`ok ${specs.length} published subpaths resolve`);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  runCli();
}
