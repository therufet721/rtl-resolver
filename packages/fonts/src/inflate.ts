import { createRequire } from "node:module";

type NodeZlib = {
  inflateSync(data: Uint8Array): Uint8Array;
  brotliDecompressSync(data: Uint8Array): Uint8Array;
  brotliCompressSync?(data: Uint8Array): Uint8Array;
  deflateSync?(data: Uint8Array): Uint8Array;
};

function loadZlib(): NodeZlib | undefined {
  if (typeof process === "undefined" || !process.versions?.node) return undefined;
  try {
    return createRequire(import.meta.url)("node:zlib") as NodeZlib;
  } catch {
    return undefined;
  }
}

export function inflateZlib(data: Uint8Array): Uint8Array {
  const zlib = loadZlib();
  if (!zlib) throw new Error("Compressed WOFF tables require Node.js zlib");
  return new Uint8Array(zlib.inflateSync(data));
}

export function brotliDecompress(data: Uint8Array): Uint8Array {
  const zlib = loadZlib();
  if (!zlib) throw new Error("WOFF2 tables require Node.js zlib");
  return new Uint8Array(zlib.brotliDecompressSync(data));
}

export function zlibAvailable(): boolean {
  return Boolean(loadZlib());
}
