import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  target: "es2020",
  external: ["react", "@radix-ui/react-direction", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-select", "@rtl-resolver/core", "@rtl-resolver/react", "@rtl-resolver/adapters"],
  banner: { js: '"use client";' },
});
