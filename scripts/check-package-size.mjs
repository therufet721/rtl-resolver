#!/usr/bin/env node
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Unminified published-entry budgets. Raise any cap only with a changelog note. */
const BUDGETS = [
  { file: "dist/index.js", max: 6144, gzip: 2048, label: "rtl-resolver ESM" },
  { file: "dist/index.cjs", max: 8192, gzip: 3072, label: "rtl-resolver CJS" },
  { file: "dist/bidi/index.js", max: 225280, gzip: 14336, label: "rtl-resolver/bidi ESM" },
  { file: "dist/bidi/index.cjs", max: 225280, gzip: 14336, label: "rtl-resolver/bidi CJS" },
  { file: "dist/plugin/index.js", max: 2048, gzip: 1024, label: "rtl-resolver/plugin ESM" },
  { file: "dist/plugin/index.cjs", max: 3072, gzip: 1536, label: "rtl-resolver/plugin CJS" },
  { file: "packages/core/dist/index.js", max: 6144, gzip: 2048, label: "@rtl-resolver/core ESM" },
  { file: "packages/core/dist/index.cjs", max: 8192, gzip: 3072, label: "@rtl-resolver/core CJS" },
  {
    file: "packages/core/dist/bidi/index.js",
    max: 225280,
    gzip: 14336,
    label: "@rtl-resolver/core/bidi ESM",
  },
  {
    file: "packages/core/dist/bidi/index.cjs",
    max: 225280,
    gzip: 14336,
    label: "@rtl-resolver/core/bidi CJS",
  },
  {
    file: "packages/core/dist/plugin/index.js",
    max: 2048,
    gzip: 1024,
    label: "@rtl-resolver/core/plugin ESM",
  },
  {
    file: "packages/core/dist/plugin/index.cjs",
    max: 3072,
    gzip: 1536,
    label: "@rtl-resolver/core/plugin CJS",
  },
  { file: "packages/adapters/dist/index.js", max: 8192, gzip: 2560, label: "@rtl-resolver/adapters ESM" },
  { file: "packages/adapters/dist/index.cjs", max: 11264, gzip: 3584, label: "@rtl-resolver/adapters CJS" },
  { file: "packages/browser/dist/index.js", max: 9216, gzip: 2560, label: "@rtl-resolver/browser ESM" },
  { file: "packages/browser/dist/index.cjs", max: 11264, gzip: 3072, label: "@rtl-resolver/browser CJS" },
  { file: "packages/cli/dist/cli.js", max: 9216, gzip: 3072, label: "@rtl-resolver/cli" },
  { file: "packages/css/dist/index.js", max: 36864, gzip: 8192, label: "@rtl-resolver/css ESM" },
  { file: "packages/css/dist/index.cjs", max: 38912, gzip: 8704, label: "@rtl-resolver/css CJS" },
  { file: "packages/eslint/dist/index.js", max: 4096, gzip: 1536, label: "@rtl-resolver/eslint ESM" },
  { file: "packages/eslint/dist/index.cjs", max: 5120, gzip: 2048, label: "@rtl-resolver/eslint CJS" },
  { file: "packages/fonts/dist/index.js", max: 37888, gzip: 9728, label: "@rtl-resolver/fonts ESM" },
  { file: "packages/fonts/dist/index.cjs", max: 39936, gzip: 10752, label: "@rtl-resolver/fonts CJS" },
  {
    file: "packages/headless-ui/dist/index.js",
    max: 3584,
    gzip: 1024,
    label: "@rtl-resolver/headless-ui ESM",
  },
  {
    file: "packages/headless-ui/dist/index.cjs",
    max: 5632,
    gzip: 1536,
    label: "@rtl-resolver/headless-ui CJS",
  },
  { file: "packages/icons/dist/index.js", max: 3584, gzip: 1024, label: "@rtl-resolver/icons ESM" },
  { file: "packages/icons/dist/index.cjs", max: 4608, gzip: 1536, label: "@rtl-resolver/icons CJS" },
  { file: "packages/motion/dist/index.js", max: 3584, gzip: 1024, label: "@rtl-resolver/motion ESM" },
  { file: "packages/motion/dist/index.cjs", max: 4608, gzip: 1536, label: "@rtl-resolver/motion CJS" },
  { file: "packages/next/dist/index.js", max: 2560, gzip: 1024, label: "@rtl-resolver/next ESM" },
  { file: "packages/next/dist/index.cjs", max: 3584, gzip: 1536, label: "@rtl-resolver/next CJS" },
  { file: "packages/mui/dist/index.js", max: 3584, gzip: 1024, label: "@rtl-resolver/mui ESM" },
  { file: "packages/mui/dist/index.cjs", max: 6144, gzip: 2048, label: "@rtl-resolver/mui CJS" },
  { file: "packages/radix/dist/index.js", max: 4096, gzip: 1024, label: "@rtl-resolver/radix ESM" },
  { file: "packages/radix/dist/index.cjs", max: 6656, gzip: 2048, label: "@rtl-resolver/radix CJS" },
  { file: "packages/react/dist/index.js", max: 5632, gzip: 1792, label: "@rtl-resolver/react ESM" },
  { file: "packages/react/dist/index.cjs", max: 7168, gzip: 2304, label: "@rtl-resolver/react CJS" },
  { file: "packages/stylelint/dist/index.js", max: 4096, gzip: 1536, label: "@rtl-resolver/stylelint ESM" },
  { file: "packages/stylelint/dist/index.cjs", max: 5120, gzip: 2048, label: "@rtl-resolver/stylelint CJS" },
  { file: "packages/testing/dist/index.js", max: 7168, gzip: 2304, label: "@rtl-resolver/testing ESM" },
  { file: "packages/testing/dist/index.cjs", max: 9216, gzip: 3072, label: "@rtl-resolver/testing CJS" },
];

let failed = false;
for (const budget of BUDGETS) {
  const path = resolve(process.cwd(), budget.file);
  if (!existsSync(path)) {
    console.error(`missing ${budget.file}; build the package first`);
    failed = true;
    continue;
  }
  const bytes = readFileSync(path);
  const gzip = gzipSync(bytes).byteLength;
  const rawOk = bytes.byteLength <= budget.max;
  const gzipOk = gzip <= budget.gzip;
  const status = rawOk && gzipOk ? "ok" : "FAIL";
  console.log(
    `${status.padEnd(4)} ${budget.label}: ${bytes.byteLength} / ${budget.max} raw, ${gzip} / ${budget.gzip} gzip (${budget.file})`,
  );
  if (!rawOk || !gzipOk) failed = true;
}

if (failed) process.exit(1);
