import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { "rtl-browser": "packages/browser/src/index.ts" },
    format: ["iife"],
    globalName: "RtlResolverBrowser",
    outDir: "test/browser/public",
    platform: "browser",
    dts: false,
    clean: true,
    target: "es2020",
    splitting: false,
  },
  {
    entry: { "rtl-e2e": "test/browser/e2e-bundle.ts" },
    format: ["iife"],
    globalName: "RtlResolver",
    outDir: "test/browser/public",
    platform: "browser",
    dts: false,
    clean: false,
    target: "es2020",
    splitting: false,
  },
]);
