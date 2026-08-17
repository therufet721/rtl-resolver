#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { publishOrder, root } from "./workspaces.mjs";

const publish = process.argv.includes("--publish");
const allowDirty = process.argv.includes("--allow-dirty");
const provenance = process.argv.includes("--provenance") || Boolean(process.env.GITHUB_ACTIONS);

if (!allowDirty) {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  if (status.status !== 0) {
    console.error(status.stderr || "git status failed");
    process.exit(1);
  }
  if (status.stdout.trim()) {
    console.error("working tree is dirty; commit or pass --allow-dirty");
    process.exit(1);
  }
}

const order = publishOrder();
console.log(publish ? "Publishing:" : "Dry run (pass --publish to upload):");
for (const pkg of order) {
  const directory = pkg.root ? root : dirname(pkg.path);
  // `npm publish --dry-run` still rejects versions that already exist on the
  // registry (the root 0.1.0 package). Packing only verifies the tarball.
  const args = publish
    ? ["publish", "--access", "public", ...(provenance ? ["--provenance"] : [])]
    : ["pack", "--dry-run"];
  console.log(`\n# ${pkg.manifest.name}@${pkg.manifest.version}`);
  const result = spawnSync("npm", args, {
    cwd: directory,
    stdio: "inherit",
    env: { ...process.env, RTL_RELEASE: "1" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!publish) {
  console.log("\nRe-run with --publish after verify:release. Use --provenance on GitHub Actions.");
}
