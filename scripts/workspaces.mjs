#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function workspacePackages() {
  const directory = join(root, "packages");
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const path = join(directory, entry.name, "package.json");
      return { name: entry.name, path, manifest: readJson(path) };
    });
}

export function workspaceNames(packages = workspacePackages()) {
  return new Set(packages.map((pkg) => pkg.manifest.name));
}

function workspaceDeps(manifest) {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ];
}

/** Core first, then dependents, then the root compatibility package last. */
export function publishOrder() {
  const packages = workspacePackages();
  const names = workspaceNames(packages);
  const remaining = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]));
  const ordered = [];
  while (remaining.size) {
    const ready = [...remaining.values()].filter((pkg) =>
      workspaceDeps(pkg.manifest).every((name) => !names.has(name) || ordered.some((item) => item.manifest.name === name)),
    );
    if (!ready.length) {
      throw new Error(`cyclic workspace dependencies: ${[...remaining.keys()].join(", ")}`);
    }
    ready.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
    for (const pkg of ready) {
      ordered.push(pkg);
      remaining.delete(pkg.manifest.name);
    }
  }
  return [
    ...ordered,
    { name: "rtl-resolver", path: join(root, "package.json"), manifest: readJson(join(root, "package.json")), root: true },
  ];
}

export { root };
