# Changelog

## 0.2.0 — 2026-08-17

First coordinated workspace release. Root `rtl-resolver@0.1.0` remains the
already-published compatibility package; this version is the first upload of
every `@rtl-resolver/*` package together with an updated root package.

### Added

- Workspace packages for core, React, Next.js App Router helpers, browser, CSS,
  CLI, linting, testing, icons, motion, fonts, adapters, and MUI/Radix/Headless
  UI wrappers.
- Baseline-aware audit/migration, CSS Modules / CSS-in-JS analysis, plugin
  `audit`/`migrate` hooks, and `@rtl-resolver/core/plugin` validation.
- GSUB joining fixture, WOFF2 empty/simple glyf reconstruction, Storybook
  example, and Chromium Playwright fixtures.

### Fixed

- React, MUI, Radix, and Headless UI packages emit `"use client"` so Next.js
  App Router can import `DirectionProvider` from a Client Component.
- Every published tarball now includes `LICENSE`, `publishConfig.access`,
  repository/homepage/bugs metadata, and an `exports["./package.json"]` entry.
- `postcss` and `stylelint` peers are optional because those packages duck-type
  the plugin API and never import the hosts.
- `rtl-resolver/plugin` re-exports `@rtl-resolver/core/plugin`.
- `@rtl-resolver/core/bidi` is on the package exports map, matching the built
  engine entry. `npm run check:exports` resolves every published subpath
  through Node after build.
- Root `src/` keeps only compatibility re-exports; the duplicate bidi engine
  copy under `src/bidi/` is gone. Unicode generators write into
  `packages/core`.

### Compatibility

- `rtl-resolver` and `rtl-resolver/bidi` still re-export `@rtl-resolver/core`
  from source, so installing both names ships two copies of the ~213 KB bidi
  tables. Prefer `@rtl-resolver/core` for new installs.
- Unit tests and published `engines.node` require Node 20+. CI is Node 20 and 22. Node 18 is EOL and untested.
- 0.x limits: VoiceOver/NVDA jobs are unproven, interpolations are not
  executed, wrappers are not full component catalogs, and `left`/`right`
  positioning is review-only.

## 0.1.0 — 2026-08-17

### Added

- Dependency-free RTL direction helpers and the full Unicode bidi engine.
- Official Unicode 17 conformance verification in the release gate.
- Workspace packages for core, React, browser, CSS, CLI, linting, testing,
  icons, motion, fonts, adapters, and MUI/Radix/Headless UI wrappers.
- Baseline-aware audit/migration commands and configurable audit plugins.
  CSS-in-JS migrate covers tagged templates, `css()` callbacks, and style
  objects, including same-file identifier spreads and computed string keys.
  CSS Modules skip ICSS chrome. Configured plugins can audit and migrate.
- GSUB joining fixture (`arabicJoiningFont`) with HarfBuzz isol/init/fina
  glyph IDs. WOFF2 unwrap reconstructs empty/simple `glyf`/`loca` and `hmtx`.
- Coordinated workspace versioning and publish scripts (`release:dry`,
  `release:publish`, `version:workspaces`). The first coordinated npm upload
  must bump past the already-published root `0.1.0`.
- Lightweight-entry size budget (6 KiB ESM / 8 KiB CJS, plus gzip caps).
  Plugin validation lives on `@rtl-resolver/core/plugin` so the lightweight
  entry stays inside that budget.

### Compatibility

- The original `rtl-resolver` and `rtl-resolver/bidi` entry points remain
  available and delegate to the canonical workspace core implementation.
- The unit-test runner requires Node 20.19+ (Vitest 4). Published packages
  still declare `engines.node >= 18`. CI runs Node 20 and 22; Node 18 is no
  longer in the test matrix.
- Production `npm audit --omit=dev` is clean. One remaining low advisory is
  in the esbuild development-server path used by Vitest/tsup, not in published
  packages.

The 0.1.0 root package is already on npm. Workspace packages were unpublished
at that version.
