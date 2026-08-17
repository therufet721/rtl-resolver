import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  target: "es2020",
  platform: "node",
  external: ["@rtl-resolver/core", "harfbuzzjs", "node:zlib", "node:module"],
});
