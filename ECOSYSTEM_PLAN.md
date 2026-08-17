# rtl-resolver Ecosystem Plan

## Goal

Expand the proven `rtl-resolver` v1 engine into modular packages for locale
direction, React, browsers, CSS, linting, icons, motion, fonts, and testing.
The current `rtl-resolver` package remains stable and dependency-free while the
new `@rtl-resolver/*` packages are introduced incrementally.

## Package map

| Package | Responsibility |
| --- | --- |
| `@rtl-resolver/core` | Locale/script direction, `dir="auto"`, bidi helpers, isolation, full UAX #9 engine |
| `@rtl-resolver/react` | `DirectionProvider`, `useDirection()`, SSR-safe `lang`/`dir`, React adapters |
| `@rtl-resolver/next` | Next.js 15/16 App Router async params/cookie direction resolution |
| `@rtl-resolver/browser` | RTL `scrollLeft`, logical previous/next, keyboard and gesture normalization |
| `@rtl-resolver/css` | Physical-to-logical analysis and optional PostCSS transforms |
| `@rtl-resolver/eslint` | ESLint rules preventing directional and mixed-content regressions |
| `@rtl-resolver/stylelint` | Stylelint rules for unsafe physical CSS properties |
| `@rtl-resolver/icons` | Directional icon metadata and mirroring policies |
| `@rtl-resolver/motion` | Logical start/end animation and transition helpers |
| `@rtl-resolver/fonts` | Script detection, font fallback, glyph coverage, typography guidance |
| `@rtl-resolver/testing` | RTL/LTR matrices, Storybook decorators, Playwright fixtures, AT detection |
| `@rtl-resolver/mui` | MUI ThemeProvider, Dialog, Menu, Popover, and Select wrappers (peers `@mui/material`) |
| `@rtl-resolver/radix` | Radix DirectionProvider, Dialog, dropdown-menu, popover, and select wrappers |
| `@rtl-resolver/headless-ui` | Headless UI dialog, menu, popover, and listbox wrappers |

Compatibility requirements:

- Keep `rtl-resolver` and `rtl-resolver/bidi` working during migration.
- Never require React, browser globals, PostCSS, lint tools, or test tools from core.
- Re-export or depend on `@rtl-resolver/core` only after the new core API is stable.

## Design principles

1. Core is deterministic, typed, dependency-free, and tree-shakeable.
2. SSR paths never read browser globals.
3. Logical CSS and semantic navigation are preferred over left/right aliases.
4. Direction decisions are explicit (`ltr`/`rtl`) at API boundaries; `auto` is
   resolved only where text or locale context is available.
5. Unicode data remains pinned, hash-verified, reproducible, and covered by the
   official UAX #9 suites.
6. Every package documents inference limits and application responsibilities.

## Phase 0 — workspace foundation

- [x] Adopt npm workspaces under `packages/`.
- [x] Make `packages/core` the sole canonical implementation without changing
      existing `rtl-resolver` behavior.
- [x] Keep a compatibility package/export for the current name.
- [x] Add shared lint, formatting, and test configuration beyond
      `tsconfig.base.json` (packages already inherit compiler options).
- [x] Add package-level READMEs, changelogs, and export-smoke tests. Owner
      metadata remains open.
- [x] Add CI for workspace typecheck, tests, builds, and UAX #9 conformance.
- [x] Coordinated 0.x versioning: `version:workspaces`, `release:dry`,
      `release:publish`, and a manual provenance-capable release workflow.

Exit criteria: clean workspace install/build, existing imports preserved, and all
current v1 gates green.

## Phase 1 — `@rtl-resolver/core`

- [x] Extract locale and script direction APIs from the current package.
- [x] Add confidence-aware script detection and `unknown` handling.
- [x] Add explicit/locale/text/fallback direction precedence helpers.
- [x] Add mixed-content isolation and directional-mark helpers.
- [x] Move the full UAX #9 engine and Unicode tables into core.
- [x] Add documented `dir="auto"` decisions and limitations.
- [x] Preserve ASCII fast paths and benchmark adversarial inputs.

Exit criteria: dependency-free, official suites green, typed API stable, and
bundle-size budget recorded.

## Phase 2 — `@rtl-resolver/react`

- [x] Implement `DirectionProvider` and `useDirection()`.
- [x] Support explicit, locale-derived, and auto modes.
- [x] Add SSR-safe `<html lang dir>` helpers for generic React SSR.
- [x] Prevent hydration mismatches around persisted client locale preferences.
- [x] Support nested direction scopes.
- [x] Test locale changes, persistence, nesting, SSR output, and hydration.
- [x] Add escaping-safe semantic React `<Bdi>` and `<Bdo>` renderers.

### Next.js integration

- [x] Add async App Router route-param and cookie locale resolution.
- [x] Support Next.js 15/16 promised request APIs without importing browser
      globals or coupling core to Next.js.
- [x] Document root-layout integration and precedence.

## Phase 3 — `@rtl-resolver/browser`

- [x] Normalize RTL `scrollLeft` across browser behaviors.
- [x] Add logical `previous()`/`next()` navigation helpers.
- [x] Normalize keyboard arrows, pointer deltas, swipe, and carousel gestures.
- [x] Add Chromium, Firefox, and WebKit browser fixtures where behavior differs.

## Phase 4 — `@rtl-resolver/css`

- [x] Analyze physical properties and suggest logical equivalents.
- [x] Detect unsafe `left`/`right`, margin, padding, inset, float, and text-align
      declarations where logical properties are appropriate.
- [x] Add an opt-in PostCSS transform with source-map validation.
- [x] Preserve intentional physical properties through configuration/comments.
- [x] Autofix only semantics-preserving transformations.

## Phase 5 — lint packages

### `@rtl-resolver/eslint`

- [x] Detect hard-coded direction assumptions and unsafe mixed interpolation.
- [x] Detect directional icons without explicit mirroring policy.
- [x] Support flat and legacy ESLint configurations.

### `@rtl-resolver/stylelint`

- [x] Detect physical CSS with logical alternatives.
- [x] Review directional gradients, transforms, shadows, and unsafe autofixes.
- [x] Add fixture and idempotence tests.
- [x] Add Stylelint autofix support.

## Phase 6 — icons and motion

### `@rtl-resolver/icons`

- [x] Define `mirrors`, `rotates`, and `neverMirrors` metadata.
- [x] Add safe icon-direction resolution and SVG transform helpers.
- [x] Test arrows, chevrons, playback controls, and neutral icons.

### `@rtl-resolver/motion`

- [x] Add logical start/end displacement and velocity helpers.
- [x] Add CSS transition helpers, reduced motion, and direction-neutral fades.
- [x] Add optional animation-library adapters (Framer Motion, etc.).

## Phase 7 — fonts

- [x] Detect scripts and likely writing systems.
- [x] Define font fallback descriptors and text-coverage checks.
- [x] Provide Arabic, Hebrew, Urdu, and Persian typography guidance.
- [x] Document shaping, joining, ligatures, and font-feature limitations.
- [x] Keep recommendations advisory and deterministic; no network runtime data.

## Phase 8 — testing integrations

- [x] Add direction-matrix helpers for LTR, RTL, and mixed fixtures.
- [x] Add Storybook decorators for locale and direction toggles.
- [x] Add Playwright-shaped helpers for computed `dir` and direction matrices.
- [x] Add screenshot baseline naming conventions for both directions.
- [x] Keep integration tools optional peer dependencies.
- [x] Add a committed Playwright project and Chromium/Firefox/WebKit engine jobs.
- [x] Add a committed Storybook 8 example app under `examples/storybook`.

## Cross-package quality gates

- Core: official Unicode suites, property tests, differential checks, benchmarks.
- React: unit, SSR, hydration, persistence, and nested-provider tests.
- Browser: real-browser fixtures and behavior-specific compatibility tests.
- CSS/lint: parser fixtures, warnings, safe autofixes, and source maps.
- Icons/motion: semantic direction tables and reduced-motion tests.
- Fonts: deterministic script and coverage fixtures with no network dependency.
- Testing: dogfood every fixture against a small example application.

Every package must have an offline fast test command. Full Unicode and browser
jobs run in CI and release verification.

## Performance and release

- Track ESM, CJS, and gzip sizes per package in CI.
- Keep browser feature detection cached and avoid layout reads in hot paths.
- Keep development-only dependencies out of published runtime packages.
- Run dependency audits and publish provenance when supported.
- Publish package-specific changelogs and migration guides.
- Use prerelease tags for experimental packages; stable packages require their
  own API, tests, docs, and bundle budgets.

## Immediate next milestone

1. Prove the macOS VoiceOver and Windows NVDA CI jobs green. Specs and
   Guidepup setup exist; they were not executed in this checkout (`RTL_AT` plus
   a real screen reader). Playwright roles are still not AT.
2. Publish the first coordinated workspace release after ownership and release
   timing are confirmed. All packages are versioned `0.2.0`; that is the first
   coordinated upload (root `rtl-resolver@0.1.0` is already on npm).

Completed from the previous immediate milestone:

- [x] Proved Arabic joining with a committed GSUB font under
      `shapeWithHarfbuzz()`.
- [x] Expanded MUI, Radix, and Headless UI wrappers across menu, popover, and
      select/listbox surfaces, with a cross-library render fixture.
- [x] Added the Stylelint `createPlugin()` compatibility export and tests.

## Implementation progress

### Phase 0 — completed step

- [x] Added npm workspace support with `packages/*`.
- [x] Added `packages/core` as `@rtl-resolver/core@0.1.0`.
- [x] Added core package exports for both the lightweight API and `./bidi`.
- [x] Added independent core build and typecheck scripts.
- [x] Preserved the root `rtl-resolver` package and its existing exports.
- [x] Added root release verification for the core workspace build.

Verification after this step:

- Root typecheck: passed.
- Root tests: 59/59 passed at the time of this historical milestone.
- Root build: passed.
- Core build: passed.
- Core typecheck: passed.

### Next step

- [x] Make `packages/core` the canonical source instead of a temporary copied
      workspace, then add the first `@rtl-resolver/react` provider and hook.

### Phase 2/3 scaffolds added

- [x] Added `@rtl-resolver/react@0.1.0` with `DirectionProvider`, `useDirection()`,
      SSR-safe initial direction, nested `dir`/`lang` attributes, and persistence.
- [x] Added `@rtl-resolver/browser@0.1.0` with logical RTL scroll positions,
      browser scroll-mode detection, logical arrow keys, and swipe deltas.
- [x] Add focused React jsdom hydration tests.
- [x] Add real-browser RTL scroll fixtures (Chromium, Firefox, WebKit).
- [x] Make `packages/core` canonical and remove the temporary source duplicate.

Verification after React/browser workspace implementation:

- Core build: passed.
- React build and declaration generation: passed.
- Browser build and declaration generation: passed.
- React and browser typechecks: passed.

### CSS and audit CLI milestone

- [x] Added `@rtl-resolver/css` with conservative physical-property,
      text-alignment, transform, and directional-utility analysis.
- [x] Added `@rtl-resolver/cli` with `rtl-resolver audit <path>` and `--strict`.
- [x] Added workspace builds and typechecks for both packages.
- [x] Ran the audit CLI against the repository: 20 files scanned, 0 findings.
- [x] Add PostCSS transforms, codemod dry-run/fix/report modes, and CSS/JSX
      parser-specific diagnostics.

Migration tooling progress:

- [x] Added CSS `migrateCss()` for safe logical-property and text-align replacements.
- [x] Added CLI `migrate <path>` with dry-run, `--fix`, and `--report` modes.
- [x] CSS and CLI builds/typechecks pass; repository dry-run reports zero safe changes.
- [x] Add parser-aware JSX/TSX style objects and tagged CSS-in-JS (styled-components / Emotion `css`).
- [x] Add Babel AST diagnostics for `css({ ... })` / style objects. TypeScript
      type literals such as `type Pos = { left: number }` are not flagged.

### Extensibility and component adapters milestone

- [x] Added typed `defineRTLConfig()` to core for locales, icons, fonts, lint,
      gestures, exceptions, and plugins.
- [x] Added `@rtl-resolver/adapters` for logical/physical placement and overlay
      fallback decisions.
- [x] Core and adapters build/typecheck successfully.
- [x] Add optional MUI/Radix/Headless UI/Floating UI direction prop mappers.
      These are not component wrappers and do not load those libraries.
- [x] Add `@rtl-resolver/mui`, `@rtl-resolver/radix`, and
      `@rtl-resolver/headless-ui` wrapper packages that import those libraries
      as peers. They wrap direction providers and dialogs; they do not wrap the
      full component catalogs.
- [x] Add framework-specific wrapper packages and component-library integration
      fixtures.

### Quality and release hardening milestone

- [x] Added shared ESLint, Prettier, TypeScript, and Vitest configuration.
- [x] Added PostCSS source-map provenance validation.
- [x] Added explicit author metadata to every publishable package.
- [x] Added raw and gzip budgets for every published ESM/CJS entry and wired
      the workspace build into the package-size CI job.
- [x] CI verify matrix is Node 20 and 22. Published `engines.node` is `>=20`.
- [x] Added an optional development-only `bidi-js` differential test and
      throughput benchmark comparison.
- [x] Added React `<Bdi>`/`<Bdo>` usage docs, included the Next.js package
      license in its npm tarball, and checked in `docs/RUN_RESULTS.md`.
- [x] Removed `ECOSYSTEM_PLAN.md` from `.gitignore` so release status is visible
      in the published repository history.
- [ ] Prove the VoiceOver and NVDA jobs on their native hosted runners.
- [ ] Version, commit, and publish the coordinated workspace release.

Current checkout verification (2026-08-17):

- Root and workspace typechecks pass; all workspace builds passed in the
  release-hardening run.
- Unit suite passes 117/117 tests across 28 files after the React/Next.js
  integration batch.
- Official Unicode 17 suites pass at 91,707/91,707 and 770,241/770,241 after
  all five source files were downloaded and SHA-256 verified.
- Benchmark includes the competitor comparison: approximately 33,599 ASCII
  resolutions/sec, 1,209 mixed analyses/sec, and 4,378 `bidi-js` mixed
  embedding-level resolutions/sec on this machine.
- All bidi unit tests and the benchmark import the canonical
  `packages/core/src/bidi` implementation, not the root compatibility source.

CLI workflow progress:

- [x] Added `rtl-resolver init` to scaffold `rtl-resolver.config.mjs`.
- [x] Added root `audit` and `migrate:dry` convenience scripts.
- [x] Verified init in a temporary directory and strict audit against the source tree.
- [x] Add config loading and baseline persistence.
- [x] Add runtime plugin execution for validated audit and migration hooks.

CSS plugin progress:

- [x] Added an opt-in PostCSS-compatible `logicalPropertiesPlugin()` with
      `preserve` mode and safe text-align/property transforms.
- [x] CSS package build and typecheck remain green.
- [x] Add PostCSS fixture tests and tagged CSS-in-JS diagnostics.
- [x] Add source-map validation for PostCSS output.

Workspace verification:

- [x] Added `typecheck:workspaces` and `build:workspaces` root commands.
- [x] Root workspace typechecks all 11 packages successfully.
- [x] Root tests remain green (now 65/65 across 16 files).
- [x] All workspace builds complete successfully.

### Icons, motion, and fonts milestone

- [x] Added `@rtl-resolver/icons` with directional metadata, mirroring policy,
      and safe default neutral-icon behavior.
- [x] Added `@rtl-resolver/motion` with logical edge signs and slide helpers.
- [x] Added `@rtl-resolver/fonts` with deterministic script detection, advisory
      font stacks, and typography requirements.
- [x] All three packages build and typecheck successfully.
- [x] Add real font-file coverage diagnostics, animation-library adapters, and
      broader icon metadata before stable publication.

### Linting and testing integration milestone

- [x] Added `@rtl-resolver/eslint` with a starter physical-direction rule and
      recommended configuration.
- [x] Added `@rtl-resolver/stylelint` with a physical-property rule.
- [x] Added `@rtl-resolver/testing` with LTR/RTL/Auto matrices and direction
      fixture helpers.
- [x] All three packages build and typecheck successfully.
- [x] Add parser-specific fixtures, migrate idempotence tests, and a committed
      Playwright engine job.
- [x] Add a committed Storybook app and Chromium visual screenshot baselines.

### Ecosystem smoke coverage

- [x] Added `test/ecosystem.test.ts` covering core, browser, CSS, icons, motion,
      fonts, adapters, and testing package contracts.
- [x] Root verification now passes 64 tests across 16 files.

### Browser/testing integration milestone

- [x] Added logical viewport paging with `nextLogicalPage()` and
      `previousLogicalPage()` to the browser package.
- [x] Added framework-neutral direction fixtures and expected document
      attribute helpers to the testing package.
- [x] Extended the ecosystem smoke suite to cover the new contracts.
- [x] Workspace builds and typechecks pass; root tests pass 65/65.
- [x] Add real Chromium/Firefox/WebKit fixtures for RTL `scrollLeft` round-trips.

### Full release verification

- [x] Root and all workspace typechecks pass.
- [x] Root tests pass 75/75 across 19 files.
- [x] All workspace builds pass.
- [x] `BidiCharacterTest`: 91,707 cases, 0 failures.
- [x] `BidiTest`: 770,241 cases, 0 failures.
- [x] CI now runs root/workspace typechecks and builds, `lint:rtl` on clean
      fixtures, Unicode conformance, core bundle-size, and Playwright engines.
- [x] Add development-only `bidi-js` differential checks and a competitor
      benchmark.
- [ ] Prove publish provenance with the first coordinated registry release
      before treating the ecosystem as release-complete.

### CI verification milestone

- [x] Expanded `.github/workflows/ci.yml` to verify all workspace packages on
      Node 18, 20, and 22.
- [x] Added a dedicated Node 20 Unicode conformance job for both official
      suites.
- [x] Added a core ESM/CJS bundle-size budget job.
- [x] Add browser matrix jobs for Chromium, Firefox, and WebKit scroll fixtures.
- [x] Add a manual OIDC/provenance-capable release workflow.
- [ ] Prove provenance against npm with the first live coordinated publish.

### Testing integrations milestone

- [x] Added a dependency-free Storybook-compatible direction decorator factory.
- [x] Added a Playwright-compatible page direction reader without making
      Playwright a runtime dependency.
- [x] Added fixture attribute helpers and temporary document direction scopes.
- [x] Workspace builds/typechecks and the 64-test suite pass.
- [x] Add an actual Playwright project as a CI engine job.
- [x] Add an actual Storybook project as an optional CI fixture.

### React SSR contract milestone

- [x] Added pure `getDirectionAttributes()` for SSR-safe `dir`/`lang`
      resolution without browser globals.
- [x] Updated `DirectionAttributes` to use the same resolver as the provider,
      preventing SSR/client attribute drift.
- [x] React package build, workspace typechecks, and the 64-test suite pass.
- [x] Added an SSR attribute contract assertion to the ecosystem smoke suite.
- [x] Add renderer-level SSR/hydration tests.
- [x] Add a framework-specific Next.js App Router adapter.

### Documentation milestone

- [x] Added an ecosystem package map and installation guidance to the root
      README, including CLI baseline usage and SSR-safe React APIs.
- [x] Linked the implementation status document from the public README.
- [x] Add package-specific API examples, migration guidance, and changelogs.

### Release documentation milestone

- [x] Added a root `CHANGELOG.md` covering the published v0.1.0 compatibility
      package and staged workspace ecosystem.
- [x] Added `RELEASE_POLICY.md` documenting coordinated versioning, gates,
      manual publishing, and prerelease expectations.
- [x] Included the changelog in the published root package file list.
- [x] Add package-specific changelogs.
- [ ] Add generated API reference pages before the first stable ecosystem
      release.

### Icon and motion safety milestone

- [x] Added explicit rotate handling for directional icon metadata.
- [x] Added `iconAttributes()` for safe SVG/DOM transform application.
- [x] Added `logicalTransition()` with reduced-motion support and bounded
      duration handling.
- [x] Workspace builds/typechecks and the 64-test suite pass.
- [x] Add Framer Motion-compatible `framerSlide()` / `framerFade()` variants
      without a framer-motion runtime dependency.

### Font diagnostics milestone

- [x] Added deterministic `analyzeTextCoverage()` reports for Arabic, Hebrew,
      Latin, and unknown code points with recommended stacks.
- [x] Added `rtl-resolver fonts <path>` for offline corpus diagnostics.
- [x] Documented the boundary between text-corpus diagnostics, binary cmap
      coverage, and full shaping/font-quality analysis.
- [x] CLI smoke test reports all expected scripts successfully.
- [x] Add TTF/OTF/WOFF/WOFF2 cmap coverage, GSUB/GPOS/GDEF presence, and WOFF2
      directory transform flags. WOFF2 unwrap reconstructs empty/simple
      `glyf`/`loca` and `hmtx`; composite glyphs are skipped.
- [x] Add `arabicJoiningFont()` GSUB isol/init/medi/fina fixture and prove
      isol vs init/fina glyph IDs through HarfBuzz.

### CLI lint workflow milestone

- [x] Added first-class `rtl-resolver lint <path>` with strict exit behavior.
- [x] Added the root `npm run lint:rtl` convenience script.
- [x] Fixed absent `--baseline` handling so the CLI never attempts to parse an
      unrelated process argument as JSON.
- [x] Verified lint exits 1 on a physical-direction finding and reports it.
- [x] Add tagged CSS-in-JS lint diagnostics and plugin loading.
- [x] Add Babel/TypeScript AST lint diagnostics for style objects beyond tagged
      templates. Type literals are skipped. CSS Modules ICSS chrome is ignored.
      `css()` callbacks, `css`/`sx` props, and kebab-case keys are included.

### Release gate refresh

- [x] `npm run verify:release` passes after the latest ecosystem changes.
- [x] Root and workspace typechecks pass.
- [x] Root tests pass 75/75 across 19 files.
- [x] Root and all workspace builds pass.
- [x] Official Unicode suites remain at 91,707/0 and 770,241/0 failures.
- [ ] Remaining release work is VoiceOver/NVDA CI proof, optional full vendor
      component catalogs, and a live provenance publish. Differential checks
      and the current overlay wrappers are implemented.

### Canonical core compatibility milestone

- [x] Root `rtl-resolver` public entry now re-exports the workspace core.
- [x] Root `rtl-resolver/bidi` public entry now re-exports the workspace bidi
      engine and Unicode tables.
- [x] Existing root deep-import test fixtures remain available during the
      transition, while published entry points use the canonical core build.
- [x] Root/workspace typechecks, builds, and 64 tests pass after consolidation.
- [x] Canonical-root conformance refresh passes 91,707/0 and 770,241/0.
- [x] Point all internal bidi tests and benchmarks at the canonical
      `packages/core/src/bidi` workspace paths. Root compatibility entry points
      remain for published `rtl-resolver/bidi` imports.
- [x] Deleted the leftover `src/bidi` implementation copies. Root `src/` is
      three re-export shims (`index.ts`, `bidi/index.ts`, `plugin.ts`); Unicode
      generators write into `packages/core`.

### Review-correction milestone

- [x] Fixed CSS `text-align` migration whitespace/escaping and added regression
      coverage for `text-align: left/right`.
- [x] Added parser-aware source analysis for JSX/TSX style objects, hard-coded
      `dir="ltr"`, and directional browser interaction references.
- [x] Restricted migration writes to CSS-family files so JS/TS source is never
      rewritten by CSS regexes.
- [x] Added runtime loading of `rtl-resolver.config.mjs` physical exceptions.
- [x] Added categorized audit output by finding kind.
- [x] React persistence now reads after mount (hydration-safe), and nested
      providers no longer own the document unless explicitly requested.
- [x] Workspace typechecks and the 64-test suite pass after these fixes.
- [x] Add AST-backed parsers, config plugin execution, and renderer-level React
      SSR/hydration tests.

### Browser hot-path milestone

- [x] Cached RTL scroll-mode detection to avoid repeated DOM probe elements.
- [x] Added `resetRtlScrollTypeCache()` for controlled test/browser resets.
- [x] Added `scrollByLogical()` alongside logical paging and start/end helpers.
- [x] Browser package build/typechecks and the 64-test suite pass.
- [x] Add real Chromium/Firefox/WebKit behavior fixtures and event-level
      carousel/gesture helpers.

### Browser navigation semantics milestone

- [x] Added axis-aware `getLogicalNavigationAction()` for horizontal controls
      and vertical grids.
- [x] Added `normalizePointerDelta()` for direction-aware drag/swipe math.
- [x] Browser package builds/typechecks and the 65-test suite pass.
- [ ] Add dedicated product fixtures for drawers, galleries, and virtualized
      lists. Real-engine pointer/touch and overlay fixtures already exist.

### Confidence-aware direction milestone

- [x] Added `resolveDirectionDetailed()` with explicit/text/locale/fallback
      source attribution and high/medium/low confidence.
- [x] Kept `resolveDirection()` backward-compatible by returning the detailed
      result's direction only.
- [x] Added core contract tests for strong text and locale decisions.
- [x] Core/workspace typechecks and the 64-test suite pass.
- [x] Add page/UI/content direction modes and richer script confidence data.

### Persian and Urdu script milestone

- [x] Core and fonts script detection now distinguish Persian-specific and
      Urdu-specific code points from shared Arabic-script text.
- [x] Added Persian/Urdu fallback stacks and joined-script typography guidance.
- [x] Added regression fixtures for Persian and Urdu-specific characters.
- [x] Core/fonts builds, workspace typechecks, and 65 tests pass.
- [x] Add locale-aware language/script confidence and binary font coverage.

### CLI project-test milestone

- [x] Added `rtl-resolver test <project>` delegation to the project npm test
      script with exit-status propagation.
- [x] Verified it runs the repository's 64-test suite successfully.
- [ ] Add RTL-specific test matrix orchestration and baseline-aware CI output.

### Mixed-content direction helpers milestone

- [x] Added `resolveAutoDirection()` for explicit `dir="auto"` decisions.
- [x] Added safe `bdiAttributes()` and `bdoAttributes()` helpers without
      generating unsanitized HTML strings.
- [x] Added core smoke coverage for auto, isolate-element, and override cases.
- [x] Add React components and escaping-aware renderer integrations for these
      attributes.

### Baseline-aware audit milestone

- [x] Added stable CSS finding keys and baseline filtering utilities.
- [x] Added CLI `--baseline <file>` support so existing findings can be
      tracked without masking newly introduced violations.
- [x] Added CLI `--write-baseline` support for deterministic JSON baselines.
- [x] Workspace builds, typechecks, and the 64-test root suite remain green.
- [x] Add config-file loading, baseline support, and parser-aware JSX/TSX
      diagnostics.
- [x] Add parser-aware CSS-in-JS diagnostics for tagged templates.

### Core direction API milestone

- [x] Added `getDirection()`, `isRTL()`, and `isLTR()` aliases with the same
      BCP 47 normalization and fallback behavior as the existing API.
- [x] Added deterministic `detectScript()` coverage for Arabic, Hebrew, Latin,
      and unknown text in both the compatibility entry and `@rtl-resolver/core`.
- [x] Added `detectDirection()` as the text-direction contract with fallback.
- [x] Extended ecosystem smoke coverage for locale, script, and text decisions.
- [x] Root typecheck, all workspace typechecks, and 64 tests pass.
- [x] Add confidence metadata, richer script families, and explicit page/UI/
      content direction modes.

## Expanded platform scope

### Production-readiness audit

The workspace packages are staged integrations, not yet a complete migration
toolkit. The following status is authoritative for the current checkout:

| Area | Current evidence | Status |
| --- | --- | --- |
| UAX #9 engine | Official Unicode suites pass with zero failures | Production-grade |
| Core locale/text APIs | Locale, mixed-script detection, isolation policy, page/UI/content | Partial |
| Mixed-content helpers | `needsIsolation` / `isolateIfNeeded`; no renderer components | Partial |
| React | Provider, SSR, nested markup, persist parser, jsdom hydrateRoot | Partial |
| Browser | Scroll, pointer swipe, overlay start-edge, viewport, Chromium E2E; Firefox/WebKit in CI | Partial |
| CSS/CLI | Regex + tagged templates + Babel object AST + CSS Modules chrome | Partial |
| ESLint/Stylelint | Physical rules; Stylelint `--fix` for safe margin/padding/border/text-align | Partial |
| Icons/motion/fonts | Policies, fades, cmap + GSUB flags + HarfBuzz WASM; joining needs GSUB fonts | Partial |
| Testing | Playwright E2E + Chromium screenshots; Guidepup VoiceOver/NVDA jobs (unproven here) | Partial |
| Forms/tables/a11y | Models plus Playwright roles; AT jobs exist, not run in this checkout | Partial |
| Visual regression / editors as products | Chromium start-edge PNGs + aria snapshot; no editor product | Partial |

“Builds” and “tests” below refer to the implemented contracts only; they do not
close the production gaps in this audit.

The audit was refreshed after the latest review-correction batch; the full
release gate remains green in the current verification section below.

### Current release verification

- [x] `npm run verify:release` passes after the review corrections.
- [x] Root/workspace typechecks and builds pass.
- [x] Root tests pass 91/91 across 23 files.
- [x] Official Unicode suites pass 91,707/0 and 770,241/0 failures.
- [x] Final verification includes the plugin contract, lint rules, React SSR
      contract, and current CLI/config behavior.
- [x] Latest verification includes Persian/Urdu detection, browser navigation,
      form/table adapters, and direction-test matrix helpers.
- [x] React SSR fixture renders `DirectionProvider` markup with correct `dir`
      and `lang` attributes; root tests now pass 91/91.
- [x] `npm run verify:release` passes with the real SSR fixture and React DOM
      server dependency.
- [x] Tests resolve workspace packages to canonical source through
      `vitest.config.ts`, preventing stale `dist` declarations from hiding API
      regressions before a build.
- [x] Three consecutive typecheck, workspace-build, and 91-test verification
      loops passed without flakiness.
- [x] A fresh full Unicode conformance run passed: BidiCharacterTest 91,707/0
      and BidiTest 770,241/0 failures.
- [x] The complete `npm run verify:release` gate passes after the extended
      contract batch, including source-aliased tests and rebuilt workspaces.
- [x] Final gate also covers the font cmap parser and its Arabic/Persian/Urdu
      coverage attribution; 91/91 tests and both official suites remain green.

Repeated verification confirms the implemented contracts are stable.
`verify:release` does **not** run Playwright or Storybook. Those are separate CI
jobs. Local `npm run test:browsers` launches Chromium only unless
`RTL_BROWSER_ENGINES=all` and Firefox/WebKit are installed. CI installs all
three with `npx playwright install --with-deps`.

### Latest repository review

- [x] Root typecheck, all workspace typechecks, root tests (96/96 across 24
      files), all workspace builds, and the clean lint gate pass in this
      checkout.
- [x] Chromium Playwright E2E (12 tests) passes locally: scroll, swipe, overlay,
      viewport, focus order, navigation/dialog/table roles, aria snapshot,
      start-edge screenshots.
- [x] `shapeWithHarfbuzz()` runs HarfBuzz WASM. cmap-only fixtures stay
      `joined: false`.
- [x] `@rtl-resolver/mui`, `@rtl-resolver/radix`, `@rtl-resolver/headless-ui`
      wrap direction providers and dialogs. Not the full component catalogs.
- [x] Stylelint `--fix` for safe properties; CSS Modules `:export`/`composes`
      are ignored.
- [x] CSS Modules ICSS (`:import`, `@value`) and CSS-in-JS callbacks/`css` props/
      kebab keys/`migrateSource` are covered. Interpolations, computed keys, and
      spreads remain unexecuted.
- [x] Guidepup VoiceOver (macOS) and NVDA (Windows) Playwright configs and CI
      jobs exist. They require `RTL_AT` and were not executed in this checkout.
- [x] `examples/storybook` builds with Storybook 8 + `DirectionStoryDecorator`.
- [x] Lightweight-entry size budget is 6 KiB ESM / 8 KiB CJS (plus gzip caps),
      checked by `npm run check:size` for both `rtl-resolver` and
      `@rtl-resolver/core`. The old 4 KB ESM cap was raised with a changelog
      note; the entry was not minified to cheat the budget.
- [x] Vitest 4.1.10 clears the previous critical `@vitest/mocker` advisory.
      Production `npm audit --omit=dev` is clean. One remaining low esbuild
      advisory is Windows development-server only (Vitest/tsup).
- [x] Coordinated workspace versioning and publish scripts exist
      (`version:workspaces`, `release:dry`, `release:publish`). Root
      `npm publish` is blocked unless `RTL_RELEASE=1`. Provenance is wired for
      GitHub Actions OIDC; a real npm upload has not been executed in this
      checkout. Root `rtl-resolver@0.1.0` is already on npm, so the first
      coordinated publish must bump versions first.
- [ ] Local Firefox and WebKit Playwright runs remain unavailable unless those
      executables are installed; CI installs all three engines.
- [ ] `verify:release` still does not invoke `test:browsers`, Storybook, or AT.
      It now does include size budgets and production audit. `verify:full` adds
      Chromium Playwright and the Storybook build; it still skips AT.
- [ ] VoiceOver/NVDA CI proof remains open. GSUB joining is proven with
      `arabicJoiningFont()` and HarfBuzz glyph IDs.

### Release tooling batch

- [x] `scripts/check-package-size.mjs` enforces unminified ESM ≤ 6144 / gzip
      ≤ 2048 and CJS ≤ 8192 / gzip ≤ 3072 for root and core entries.
- [x] CI `package-size` job builds root + core and runs `check:size`. CI verify
      matrix is Node 20 and 22; published `engines.node` is `>=20`.
- [x] `scripts/publish-workspaces.mjs` publishes in dependency order (core
      first, `rtl-resolver` last). Default is dry-run; `--publish` uploads.
- [x] `scripts/version-workspaces.mjs` syncs every workspace + root version and
      internal `@rtl-resolver/*` dependency ranges.
- [x] Each workspace has a `CHANGELOG.md`. `RELEASE_POLICY.md` documents
      coordinated 0.x versions, size table, and that `verify:release` is not a
      full ecosystem proof.
- [x] `.github/workflows/release.yml` is a manual `workflow_dispatch` with
      `id-token: write` and dry-run default true. Not proven with a live npm
      publish.
- [ ] Real npm publish with provenance, Firefox/WebKit locally, AT CI proof,
      full MUI/Radix/Headless catalogs, and composite WOFF2 glyf reconstruction
      remain open.

### CSS Modules and CSS-in-JS semantics batch

- [x] ICSS `:export`, `:import`, `@value`, and `composes` are ignored in
      analysis and safe migrate. Class names such as `.left` are not properties.
      `:global` / `:local` bodies stay visible as CSS.
- [x] Tagged templates plus `css(() => \`...\`)` callback templates.
- [x] Style objects from `css()`, `style()`, `styled.*`, `sx`/`css`/`style` JSX
      props, and kebab-case keys. Type literals stay ignored.
- [x] Object values: `textAlign: left|right`, `float`, `translateX`, directional
      gradients, four-value padding/margin/inset (review-only).
- [x] `migrateSource` rewrites safe CSS-in-JS the same way as CSS. CLI `migrate`
      includes `.ts`/`.tsx`/`.js`/`.jsx`. `left`/`right` stay review-only.
- [ ] Interpolations are masked, not executed. Unknown CSS-in-JS factories
      are not followed. Same-file identifier spreads and computed string keys
      are analyzed.

### General project review

- [x] Unit tests: 96 across 24 files after CSS Modules / CSS-in-JS semantics.
      Unicode suites and Chromium E2E remain separate gates.
- [x] Chromium browser coverage passes locally (12 tests); Storybook builds
      successfully. Firefox/WebKit and native AT remain CI/host dependent.
- [x] ESM size budget raised to 6 KiB (documented). CJS stays at 8 KiB.
- [x] Critical Vitest advisory addressed by upgrading to 4.1.10. Remaining
      toolchain audit is one low esbuild Windows-serve finding.
- [x] Coordinated versioning, package changelogs, and publish automation exist.
      They have not been proven with a real registry upload.
- [ ] `verify:release` still does not include Playwright, Storybook, or AT;
      those remain separate CI gates. Size and production audit are now in
      `verify:release`. `verify:full` adds Chromium Playwright and Storybook.

### Plugin extensibility milestone

- [x] Added dependency-free `RTLPlugin`, `RTLPluginContext`, and
      `RTLPluginFinding` contracts to `@rtl-resolver/core`.
- [x] CLI loads configured plugin modules from `rtl-resolver.config.mjs` and
      merges their audit findings into strict/category-aware output.
- [x] Added a committed fixture plugin and verified it causes strict audit
      failure with a categorized finding.
- [x] Workspace typechecks and the 64-test suite pass.
- [x] Add plugin migration hooks, validation diagnostics
      (`@rtl-resolver/core/plugin`), and CLI wiring. Compatibility remains 0.x.

### Lint integration milestone

- [x] ESLint now includes `no-directional-assumptions` for `scrollLeft`,
      physical arrow-key handling, and hard-coded `dir="ltr"`.
- [x] Stylelint now reviews physical `translateX()` and left/right gradients
      in addition to physical properties.
- [x] Both lint packages build/typecheck successfully with the 64-test suite.
- [x] Add parser-backed autofix/idempotence fixtures for migrate and Stylelint
      reporting. Legacy ESLint/Stylelint version matrix tests remain open.

### Direction test matrix milestone

- [x] Added dependency-free `directionTest()`, `rtlTest()`, and `ltrTest()`
      runners for reusable LTR/RTL/Auto fixtures.
- [x] Added async document fixture restoration and `assertPageDirection()`.
- [x] Added contract coverage; root tests now pass 66/66 across 16 files.
- [x] Add a committed Playwright project with Chromium/Firefox/WebKit scroll fixtures.
- [x] Add visual screenshot baselines (Chromium start-edge PNGs) and a Storybook app.

### Forms and tables adapter milestone

- [x] Added `resolveInputDirection()` so field content can differ from UI
      direction while preserving a deterministic fallback.
- [x] Added explicit `semanticColumnOrder()` and `visualColumnOrder()` helpers,
      documenting that DOM/accessibility order should remain stable.
- [x] Added ecosystem contract coverage; 65 tests pass.
- [x] Add focus-order, roving tabindex, focus-trap, landmark, sticky-column
      style, and screen-reader table models that never reverse DOM.
- [x] Verify those models in Playwright (focus order + aria snapshot).
- [ ] Verify those models with NVDA or VoiceOver.

### Extended contract batch

- [x] Correct Arabic presentation-form classification so it cannot be reported
      as Hebrew by core script detection.
- [x] Add explicit page/UI/content/auto context resolution in core.
- [x] Expand CSS audit diagnostics for float, directional gradients, and
      horizontal shadows without applying unsafe automatic migrations.
- [x] Add form direction models, stable table DOM order, and visual column
      projections to the adapters package.
- [x] Add framework-neutral swipe recognition, browser viewport matrices,
      explicit icon-policy checks, and logical animation keyframes.
- [x] Add regression coverage for Arabic presentation forms, context resolution,
      float/gradient CSS findings, swipe semantics, form/table models, icon
      policies, and logical animation keyframes.
- [x] Add dependency-free TrueType/OpenType cmap range inspection and expose
      binary coverage in the `fonts` CLI report.
- [x] Attribute distinctive Persian and Urdu code-point ranges in binary font
      coverage reports while retaining shared Arabic-script coverage.
- [x] Add an ESLint directional-icon policy rule and Stylelint horizontal-shadow
      diagnostics.
- [x] Integrate scroll contracts with Chromium/Firefox/WebKit Playwright jobs.
- [x] Add accessibility and visual-regression engine jobs.

### Platform-gap batch (helpers, not engines)

- [x] Dominant mixed-script detection and Hebrew presentation-form classification
      (U+FB1D–FB4F). Arabic presentation forms remain Arabic.
- [x] `needsIsolation()` / `isolateIfNeeded()` so ordinary same-direction text
      is not wrapped.
- [x] CSS `left`/`right` are review-only; migrate no longer rewrites positioning.
      JS analysis no longer runs CSS regexes on TS/JS source.
- [x] Unique cmap code-point counts and `yes`/`partial`/`no` script marks.
      `rtl-resolver fonts` prints a per-font matrix. CLI README matches behavior.
      `--dry-run` is a first-class migrate flag.
- [x] Carousel/keyboard/gesture primitives: `getNextDirection`,
      `resolveArrowNavigation(logical|physical)`, `isNextSwipe`, roving index,
      paging button state.
- [x] A11y/search/editor fixtures: `shouldReverseDomOrder()`, mixed accessible
      names, sticky columns without reversing DOM, `SEARCH_FIXTURES`,
      `EDITOR_FIXTURES`.
- [x] Storybook LTR/RTL/Auto toolbar + global decorator. Visual regression
      screenshot IDs and optional tablet matrix. Genuine script fixtures.
- [x] Nested React SSR markup test and `parsePersistedDirection()`.
- [x] Migration guide: `docs/MIGRATION.md`.
- [x] Root tests pass 96/96 across 24 files; workspace typechecks pass.
- [x] Chromium/Firefox/WebKit Playwright jobs and required `lint:rtl` CI exist.
- [x] WOFF/WOFF2 cmap unwrap, touch/overlay/viewport fixtures, Chromium
      screenshot + aria baselines, Storybook example app, and Playwright a11y
      checks exist.
- [ ] VoiceOver/NVDA CI proof remains open. GSUB joining is proven with
      `arabicJoiningFont()` and HarfBuzz glyph IDs.

### Parser, CI lint, and real-browser batch

- [x] Tagged-template CSS-in-JS analysis for `css`, `styled.div`, `styled(Component)`,
      `keyframes`, and Emotion `css`. Interpolations are masked, not executed.
      `rtl-resolver lint` reports physical properties inside those templates.
- [x] CLI `ignore` from `rtl-resolver.config.mjs`. Required CI job
      `npm run lint:rtl` scans `test/fixtures/lint/clean` (0 findings). Dirty and
      CSS-in-JS fixtures fail lint (exit 1). Engine source is not dogfooded as a
      consumer app.
- [x] PostCSS plugin fixture + migrate idempotence tests. Stylelint and ESLint
      fixture tests. Stylelint `--fix` rewrites safe margin/padding/border and
      `text-align`; `left`/`right` stay review-only.
- [x] Focus/sticky/landmark/screen-reader table models; `overlayPlacementOrder`,
      `sliderKeys`. DOM order is never reversed.
- [x] Framer-shaped motion variants without importing framer-motion.
- [x] Playwright project: RTL `scrollLeft` classification and logical position
      round-trips in Chromium, Firefox, and WebKit (CI matrix; Chromium passed
      locally, other engines require their installed executables).
- [x] Root tests 96/96 across 24 files; workspace typechecks and builds pass.
- [x] WOFF/WOFF2 cmap unwrap (Node zlib/brotli). Not a shaping engine.
- [x] Playwright E2E: pointer swipe, overlay start-edge, viewport inline size,
      focus order, dialog/table semantics, aria snapshot, Chromium PNGs.
- [x] `examples/storybook` is a real Storybook 8 app with LTR/RTL/Auto toolbar.
      Built in a separate CI job; not part of `verify:release`.
- [x] Babel object AST for `css({ marginLeft, left })`. TypeScript type literals
      are not flagged. `@babel/parser` is a CSS package dependency.
- [x] MUI/Radix/Headless/Floating UI direction prop mappers plus wrapper
      packages for direction providers and dialogs.
- [x] `shapeWithHarfbuzz()` (HarfBuzz WASM). cmap-only fonts stay `joined: false`.
- [x] CSS Modules `:export`/`composes` ignored; Stylelint `--fix` for safe
      properties.
- [x] CSS Modules ICSS `:import` and `@value` ignored; class selectors such as
      `.left` are not treated as properties. `:global` / `:local` declarations
      remain real CSS.
- [x] CSS-in-JS: `css(() => \`...\`)` callbacks, Emotion `css` prop, vanilla
      `style()` objects, kebab-case keys, object `textAlign`/`float`/`translateX`
      values, and `migrateSource` for safe template/object rewrites.
      Interpolations are still masked, not executed. Same-file identifier
      spreads and computed string keys are analyzed.
- [x] Guidepup VoiceOver/NVDA Playwright configs and CI jobs. Not run in this
      checkout; require `RTL_AT` and the host screen reader.
- [ ] VoiceOver/NVDA CI proof remains unproven.

### Joining, plugins, wrappers, and CSS follow-through batch

- [x] `arabicJoiningFont()` is a committed GSUB isol/init/medi/fina SFNT.
      HarfBuzz shapes isolated meem to isol (glyph 1) and the pair to init+fina
      (glyphs 2 and 4). RTL buffer output is visual order (fina, then init).
- [x] WOFF2 unwrap reconstructs transformed empty/simple `glyf`/`loca` and
      `hmtx`. Composite glyphs are skipped so cmap coverage can still succeed.
- [x] `validateRTLPlugin` lives on `@rtl-resolver/core/plugin` so the
      lightweight core entry stays under 6 KiB. CLI skips plugins with errors
      and runs `migrate` hooks during `rtl-resolver migrate`.
- [x] Menu/Popover/Select wrappers exist for MUI, Radix, and Headless UI.
      Stylelint exports `createPlugin` / `ruleName`. Full catalogs are not wrapped.
- [x] CSS analysis follows same-file identifier spreads and computed
      `StringLiteral` keys. Interpolations and unknown factories stay unexecuted.
- [x] Shared `tsconfig.base.json`, `test/exports.test.ts`, and `verify:full`
      (`verify:release` + Chromium Playwright + Storybook build). AT is still
      not in that script.
- [x] Root tests 106/106 across 26 files; workspace typechecks and builds pass.
      Core lightweight ESM is 5666/6144 bytes.
- [ ] VoiceOver/NVDA execution, live npm publish with provenance, Firefox/WebKit
      locally, composite WOFF2 glyf reconstruction, and interpolations executed
      as CSS remain open.

The package map above is the implementation boundary. The following product
capabilities are the acceptance scope for the complete toolkit.

### Direction and content

- [x] Expose `getDirection(locale)`, `isRTL(locale)`, and `isLTR(locale)` with
      BCP 47 normalization, safe fallback, and identical SSR/browser behavior.
- [x] Add `detectDirection(text)` and `detectScript(text)` for Arabic, Hebrew,
      Persian, Urdu, Latin, mixed scripts, numbers, punctuation, URLs, email,
      usernames, code, and unknown content.
- [x] Distinguish page, UI, content, and automatically detected direction.
- [x] Provide safe `dir="auto"`, `<bdi>`, `<bdo>`, isolation, and mixed-content
      helpers without wrapping ordinary content unnecessarily.

### Audit, migration, and static analysis

- [x] Add `npx rtl-resolver audit <path>` for physical CSS, utility classes,
      transforms, `scrollLeft`, arrow handlers, and hard-coded alignment.
- [x] Add `npx rtl-resolver migrate <path>` with `--dry-run`, `--fix`, and
      `--report`; only perform semantics-preserving transforms automatically.
- [x] Report ambiguous `left`, `right`, and `translateX` cases for review rather
      than silently changing them.
- [x] Support CSS, SCSS-as-CSS, JSX/TSX style objects, tagged CSS-in-JS
      (styled-components / Emotion `css`, `css()` callbacks, `css`/`sx` props,
      kebab-case keys), and Babel object ASTs. CSS Modules skip ICSS chrome
      (`:export`, `:import`, `@value`, `composes`) and class-name utilities;
      declarations inside modules still flag. Four-value padding/margin/inset
      are review-only. Interpolations are not executed. Same-file identifier
      spreads and computed string keys are analyzed.
- [x] Add `rtl-resolver lint` as a required CI job against clean fixtures.
      Baseline JSON still exists in the CLI for consumer repos.

### Browser interaction primitives

- [x] Normalize logical scroll positions and prove RTL `scrollLeft` round-trips
      in Chromium, Firefox, and WebKit.
- [x] Add logical paging, carousel, and roving-index helpers without owning a
      proprietary carousel component.
- [x] Normalize keyboard navigation while preserving intentional physical/spatial
      navigation use cases.
- [x] Normalize swipe and pointer-delta gestures; drawers/image-viewers remain
      application-owned.
- [x] Add real-browser coverage for pointer swipe, overlays, and viewport size.

### Icons, motion, and typography

- [x] Define icon metadata for `mirrors`, `rotates`, and `neverMirrors`, including
      explicit policies for ambiguous undo, redo, reply, send, and refresh icons.
- [x] Add direction-aware start/end motion helpers while preserving direction-
      neutral fades, spinners, opacity, scale, and loading animations.
- [x] Detect scripts and provide advisory font stacks, glyph coverage, fallback,
      and typography guidance. Clipping and font-loading remain application-owned.
- [x] Cover Arabic, Persian, Urdu, and Hebrew while documenting shaping, joining,
      ligatures, and font-feature limits honestly.
- [x] Add `npx rtl-resolver fonts <path>` with per-font script coverage reports.

### Framework and component adapters

- [x] Add optional overlay/slider/dialog *models* (placement order, slider keys,
      focus trap), prop mappers, and MUI/Radix/Headless UI wrapper packages for
      direction providers, dialogs, menus, popovers, and selects. Full component
      catalogs are not wrapped.
- [x] Keep adapters independent from core and from one another.
- [x] Add configuration hooks for framework, CSS system, component library, and
      font provider without making any one ecosystem mandatory.

### Forms, data interfaces, and accessibility

- [x] Add fixtures and diagnostics for text inputs, search, email, URLs, numeric
      and date/time fields. Combobox/date-picker components remain application-owned.
- [x] Allow input direction to differ from surrounding UI direction.
- [x] Verify tables: column order, sticky columns, and sort metadata without
      reversing DOM order. Filtering/pagination/selection remain application-owned.
- [x] Preserve DOM order and accessibility while changing visual direction.
- [x] Add focus-order, landmark, focus-trap, and dialog *models*.
- [x] Test those models with Playwright focus order, landmark/dialog/table
      roles, and an aria snapshot.
- [x] Add Guidepup VoiceOver (macOS) and NVDA (Windows) jobs. They were not
      executed in this checkout.

### Storybook, Playwright, and visual regression

- [x] Add a Storybook decorator with LTR, RTL, and Auto controls.
- [x] Provide genuine Arabic, Hebrew, Persian, and Urdu fixtures rather than
      reversed or placeholder Latin strings.
- [x] Add Playwright-shaped helpers such as `rtlTest`, `ltrTest`, and `directionTest`.
- [x] Run Chromium/Firefox/WebKit jobs for RTL scroll, swipe, overlay, and
      viewport fixtures. Local default is Chromium; CI installs all three.
- [x] Store Chromium start-edge PNG baselines and an aria snapshot of the E2E fixture.
- [x] Test search, dynamic content, and editor fixtures for mixed-direction copy.
      Cursor/selection/preview parity remains application-owned.

### Extensibility and documentation

- [x] Add `defineRTLConfig({ locales, icons, fonts, lint, gestures,
      physicalExceptions, plugins })`.
- [x] Define plugin interfaces for audit and migrate plugins, including a
      Tailwind class scanner and `validateRTLPlugin`. Official
      react()/storybook()/playwright() runtime plugins remain thin.
- [x] Add `npx rtl-resolver init` to scaffold configuration.
- [x] Document migration from an existing LTR application in `docs/MIGRATION.md`.

## Complete toolkit definition of done

A release is considered platform-complete when a team can use the toolkit to:

1. Measure the RTL work required in an existing LTR application.
2. Establish reliable page, UI, and content direction sources.
3. Render mixed LTR/RTL content safely.
4. Migrate direction-sensitive layouts without unsafe rewrites.
5. Normalize scrolling, keyboard, touch, and motion behavior.
6. Handle directional icons, typography, fonts, forms, tables, and data-heavy UI.
7. Verify accessibility and visual order without reversing the DOM incorrectly.
8. Test LTR/RTL on components, desktop/mobile browsers, and visual baselines.
9. Detect and prevent new direction regressions in CI.
10. Extend behavior through configuration and plugins without forking the toolkit.

The result should be a reusable RTL engineering platform, not a collection of
isolated direction fixes.
