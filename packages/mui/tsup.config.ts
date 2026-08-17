import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  target: "es2020",
  external: ["react", "@mui/material", "@emotion/react", "@emotion/styled", "@rtl-resolver/core", "@rtl-resolver/react", "@rtl-resolver/adapters"],
  banner: { js: '"use client";' },
});
