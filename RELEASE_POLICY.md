# Release policy

`rtl-resolver` and the `@rtl-resolver/*` workspace packages use coordinated
0.x versions. Every package in a release shares the same version string.

## What must pass

`npm run verify:release` runs typechecks, unit tests, builds, the lightweight
entry size budget, Node export-map resolution (`check:exports`), production
`npm audit --omit=dev`, lint, and both official Unicode suites.

It does **not** run Playwright, Storybook, or NVDA/VoiceOver. Those stay
separate CI jobs. A green local `verify:release` is not a full ecosystem proof.

`npm run verify:full` adds `test:browsers` (local default: Chromium) and the
Storybook build. It still does not run screen readers.

`npm audit --omit=dev` is the production gate. The remaining low esbuild
advisory (Windows development-server file read) lives in Vitest/tsup and is
not shipped in the published packages.

## Size budget

All published JavaScript entry points have unminified raw and gzip budgets in
`scripts/check-package-size.mjs`. The lightweight root/core caps are:

| Artifact | Raw                | Gzip       |
| -------- | ------------------ | ---------- |
| ESM      | 6144 bytes (6 KiB) | 2048 bytes |
| CJS      | 8192 bytes (8 KiB) | 3072 bytes |

The previous 4096-byte ESM cap matched the helper-only API. Isolation, script
detection, plugins, and page/UI/content resolution now live in that entry.
The core/root bidi subpaths and every workspace ESM/CJS entry are also gated.
The root package bundles its own bidi copy (it does not depend on
`@rtl-resolver/core` at runtime), so installing both names ships the tables
twice. Raise caps only with a changelog note.

## Publishing

Release order is computed from workspace dependencies (core first, root last):

```sh
npm run verify:release
npm run release:dry
npm run release:publish
```

`release:publish` requires a clean git tree. Unicode fetch writes into
gitignored `.cache/`, so the release workflow does not pass `--allow-dirty`.
Pass `--provenance` on GitHub Actions so npm provenance can be attached. Local
publishes without OIDC will not record provenance.

Bump every workspace together:

```sh
node scripts/version-workspaces.mjs 0.2.0
npm install
```

Then add entries to the root changelog and each package `CHANGELOG.md`.

Patch releases may fix implementation or documentation defects without
changing public contracts. New package APIs require changelog entries and
contract tests. Experimental integrations should use a prerelease tag until
they have real browser/parser fixtures and documented bundle budgets.

The root `rtl-resolver@0.1.0` package is already on npm. **0.2.0** is the first
coordinated workspace release. Do not republish 0.1.0.

The manual `workflow_dispatch` release workflow is the supported way to publish
with provenance. CI on pull requests never publishes. `release:dry` packs
tarballs only and does not talk to the registry version check.
