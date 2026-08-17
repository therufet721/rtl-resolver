import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  target: "es2020",
  external: ["react", "@rtl-resolver/core"],
  banner: { js: '"use client";' },
});
