import { defineConfig } from "tsup";
export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@rtl-resolver/core", "@rtl-resolver/core/plugin", "@rtl-resolver/css", "@rtl-resolver/fonts", "node:zlib", "node:module"],
});
