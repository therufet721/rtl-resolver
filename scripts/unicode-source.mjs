import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../", import.meta.url));
export const manifest = JSON.parse(
  fs.readFileSync(new URL("./unicode-manifest.json", import.meta.url), "utf8")
);

/** Default location the verified downloads land in. */
export function cacheDir() {
  return path.join(repoRoot, ".cache", "unicode", manifest.unicodeVersion);
}

export function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Read a pinned Unicode source file and fail closed if its contents do not
 * match the committed manifest hash, so generated tables can never be built
 * from an unverified or locally-edited input.
 */
export function readVerified(name, file = path.join(cacheDir(), name)) {
  const entry = manifest.files[name];
  if (!entry) throw new Error(`${name} is not listed in scripts/unicode-manifest.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`${file} is missing. Run \`npm run unicode:fetch\` first.`);
  }
  const bytes = fs.readFileSync(file);
  const hash = sha256(bytes);
  if (hash !== entry.sha256) {
    throw new Error(`${file}: SHA-256 mismatch\n  expected ${entry.sha256}\n  actual   ${hash}`);
  }
  return { text: bytes.toString("utf8"), sha256: hash, url: entry.url };
}

export function resolveOutput(relative, override) {
  return override ? path.resolve(override) : path.join(repoRoot, relative);
}
