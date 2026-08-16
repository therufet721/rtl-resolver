import fs from "node:fs";
import path from "node:path";
import { cacheDir, manifest, sha256 } from "./unicode-source.mjs";

const outputDir = process.argv[2] ?? cacheDir();
fs.mkdirSync(outputDir, { recursive: true });

for (const [name, entry] of Object.entries(manifest.files)) {
  const target = path.join(outputDir, name);
  const response = await fetch(entry.url);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const hash = sha256(bytes);
  if (hash !== entry.sha256) throw new Error(`${name}: SHA-256 mismatch`);
  if (bytes.subarray(0, 256).toString("utf8").toLowerCase().includes("<html")) throw new Error(`${name}: HTML response`);
  fs.writeFileSync(target, bytes);
  console.log(`verified ${name}`);
}
