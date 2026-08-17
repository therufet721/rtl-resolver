#!/usr/bin/env node
import { publishOrder, writeJson, workspaceNames } from "./workspaces.mjs";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("usage: node scripts/version-workspaces.mjs <semver>");
  process.exit(1);
}

const names = workspaceNames();
names.add("rtl-resolver");

function bumpDeps(record = {}) {
  const next = { ...record };
  for (const name of Object.keys(next)) {
    if (names.has(name)) next[name] = version;
  }
  return next;
}

for (const pkg of publishOrder()) {
  const manifest = pkg.manifest;
  manifest.version = version;
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    if (manifest[field]) manifest[field] = bumpDeps(manifest[field]);
  }
  writeJson(pkg.path, manifest);
  console.log(`${manifest.name}@${version}`);
}

console.log(`\nUpdated workspace versions. Add changelog entries, then npm install to refresh the lockfile.`);
