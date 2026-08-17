import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const source = (name: string) => resolve(process.cwd(), "packages", name, "src", "index.ts");

export default defineConfig({
  resolve: {
    alias: {
      "@rtl-resolver/core/plugin": resolve(process.cwd(), "packages/core/src/plugin.ts"),
      "@rtl-resolver/core/bidi": resolve(process.cwd(), "packages/core/src/bidi/index.ts"),
      "@rtl-resolver/core": source("core"),
      "@rtl-resolver/adapters": source("adapters"),
      "@rtl-resolver/browser": source("browser"),
      "@rtl-resolver/css": source("css"),
      "@rtl-resolver/eslint": source("eslint"),
      "@rtl-resolver/fonts": source("fonts"),
      "@rtl-resolver/icons": source("icons"),
      "@rtl-resolver/motion": source("motion"),
      "@rtl-resolver/next": source("next"),
      "@rtl-resolver/react": resolve(process.cwd(), "packages/react/src/index.tsx"),
      "@rtl-resolver/mui": resolve(process.cwd(), "packages/mui/src/index.tsx"),
      "@rtl-resolver/radix": resolve(process.cwd(), "packages/radix/src/index.tsx"),
      "@rtl-resolver/headless-ui": resolve(process.cwd(), "packages/headless-ui/src/index.tsx"),
      "@rtl-resolver/stylelint": source("stylelint"),
      "@rtl-resolver/testing": source("testing"),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "test/browser/**", "test/at/**"],
  },
});
