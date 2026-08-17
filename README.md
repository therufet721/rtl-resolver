# rtl-resolver

Dependency-free RTL and Unicode bidirectional-text toolkit for JavaScript and
TypeScript. Locale helpers stay under **6 KiB**. The full UAX #9 engine lives
on a separate subpath, passes **both official Unicode 17 suites with zero
failures**, and never reverses your DOM.

```sh
npm install @rtl-resolver/core
```

```ts
import { directionFromLocale, isolateIfNeeded, resolveDirection } from "@rtl-resolver/core";
import { analyzeBidi, resolveBidiLevels } from "@rtl-resolver/core/bidi";

directionFromLocale("ar-EG"); // "rtl"
resolveDirection({ direction: "auto", text: userInput, locale: userLocale });
isolateIfNeeded("John Smith", "rtl");
resolveBidiLevels("مرحبا 123");
analyzeBidi("Hello שלום", { baseDirection: "auto" });
```

Existing `rtl-resolver` / `rtl-resolver/bidi` imports still work. New apps
should depend on `@rtl-resolver/core` so they do not ship two copies of the
bidi tables.

## Why this exists

Most RTL bugs are not “flip the page.” They are mixed-script names in Arabic
UI, physical `margin-left` in CSS-in-JS, `scrollLeft` that means the opposite
in Firefox, and `dir="ltr"` hard-coded in a layout. This workspace is the
engine plus the audit/migrate/React/browser layers around it.

| You need                                   | Use                                                 |
| ------------------------------------------ | --------------------------------------------------- |
| Page/UI direction from locale              | `@rtl-resolver/core`                                |
| Mixed-content isolation, `<bdi>` / `<bdo>` | `@rtl-resolver/core`, `@rtl-resolver/react`         |
| Spec-accurate levels, runs, visual maps    | `@rtl-resolver/core/bidi`                           |
| Next.js App Router `lang` / `dir`          | `@rtl-resolver/next` + a Client `DirectionProvider` |
| Physical CSS → logical CSS                 | `@rtl-resolver/cli` (`audit`, `migrate`)            |
| Scroll, keys, swipes                       | `@rtl-resolver/browser`                             |
| MUI / Radix / Headless menus and dialogs   | `@rtl-resolver/mui`, `radix`, `headless-ui`         |

It will **not** reverse DOM order, auto-rewrite `left` / `right` positioning,
execute CSS interpolations, or wrap entire component catalogs.

## Unicode 17 conformance

The engine is a full UAX #9 pipeline (P1–P3, X1–X10, W1–W7, N0–N2, I1–I2,
L1–L2). Official suites are a release gate:

| Suite                   |   Cases | Failures |
| ----------------------- | ------: | -------: |
| `BidiCharacterTest.txt` |  91,707 |        0 |
| `BidiTest.txt`          | 770,241 |        0 |

```sh
npm run test:bidi:conformance   # hash-verified Unicode 17 download + both suites
npm test                        # offline smoke subset + 125 unit tests
```

`reorderBidi()` is for terminals, canvas, and diagnostics. Browsers already
apply bidi layout — inserting an already-reordered string into HTML can
reorder it twice. Pass `applyL3: true` when a renderer must keep combining
marks beside their base.

## Benchmarks and size

Vitest benches use 100× repeated strings on this machine. Numbers are
diagnostic, not CI gates. `rtl-resolver` and `bidi-js` expose different
contracts and Unicode versions, so the comparison is throughput only.

| Bench                            | ops/sec |
| -------------------------------- | ------: |
| ASCII `resolveBidiLevels`        | ~33,600 |
| Mixed `analyzeBidi`              |  ~1,210 |
| `bidi-js` mixed embedding levels |  ~4,380 |

ASCII-only LTR text takes a fast path (printable ASCII + TAB) that agrees with
the full pipeline. Mixed Hebrew/Arabic/Latin pays for the real algorithm.

| Published entry             | ESM raw | ESM gzip |
| --------------------------- | ------: | -------: |
| `@rtl-resolver/core`        |  5.7 KB |   1.8 KB |
| `@rtl-resolver/core/bidi`   |  212 KB |  12.5 KB |
| `@rtl-resolver/core/plugin` |  1.0 KB |   0.4 KB |

Every workspace ESM/CJS file has a raw + gzip budget in
`scripts/check-package-size.mjs`. Installing both `rtl-resolver` and
`@rtl-resolver/core` ships the bidi tables twice (~213 KB / ~14 KB gzip).

```sh
npm run benchmark
npm run check:size
```

## Quick start

### Direction from locale and text

```ts
import {
  directionFromLocale,
  directionFromText,
  getDirection,
  inlineSides,
  isolate,
  resolveDirection,
} from "@rtl-resolver/core";

directionFromLocale("ar-EG"); // "rtl"
directionFromText("مرحبا بالعالم"); // "rtl"
resolveDirection({ direction: "auto", text: userInput, locale: userLocale });
inlineSides("rtl"); // { start: "right", end: "left" } — only when an API is physical
```

`resolveDirection()` uses an explicit `ltr`/`rtl` value first. In `auto` mode
it checks the first strong character in `text`, then the locale, then
`fallback` (default `ltr`). Prefer CSS logical properties over `inlineSides()`.

### React and Next.js

```tsx
import { cookies } from "next/headers";
import { resolveNextDirection } from "@rtl-resolver/next";
import { DirectionProvider } from "./direction-provider";

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { dir, lang } = await resolveNextDirection({ params, cookies: cookies() });
  return (
    <html dir={dir} lang={lang}>
      <body>
        <DirectionProvider locale={lang}>{children}</DirectionProvider>
      </body>
    </html>
  );
}
```

```tsx
"use client";
export { DirectionProvider } from "@rtl-resolver/react";
```

`@rtl-resolver/react` is a Client Component module (`"use client"`). Resolve
`dir` / `lang` on the server with `@rtl-resolver/next`; wrap the tree from a
client file. `<Bdi>` and `<Bdo>` are escaping-safe mixed-content elements.

### Audit an existing LTR app

```sh
npx rtl-resolver init
npx rtl-resolver audit ./src --write-baseline --baseline .rtl-resolver-baseline.json
npx rtl-resolver migrate ./src --dry-run --report
```

Safe migrate rewrites margin/padding/border and `text-align`. Positioning
`left` / `right` stays review-only. Full walkthrough:
[`docs/MIGRATION.md`](./docs/MIGRATION.md).

## Packages

| Package                                                                                                       | Role                                                  |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`@rtl-resolver/core`](./packages/core)                                                                       | Locale, script, isolation, UAX #9, plugin types       |
| [`@rtl-resolver/react`](./packages/react)                                                                     | `DirectionProvider`, `useDirection`, `<Bdi>`, `<Bdo>` |
| [`@rtl-resolver/next`](./packages/next)                                                                       | App Router promised params/cookies → `lang`/`dir`     |
| [`@rtl-resolver/browser`](./packages/browser)                                                                 | Logical scroll, paging, keys, swipes                  |
| [`@rtl-resolver/css`](./packages/css) + [`cli`](./packages/cli)                                               | CSS/CSS-in-JS analysis, `audit` / `migrate` / `init`  |
| [`@rtl-resolver/eslint`](./packages/eslint) / [`stylelint`](./packages/stylelint)                             | Direction regressions in JS and CSS                   |
| [`@rtl-resolver/fonts`](./packages/fonts)                                                                     | cmap coverage, GSUB joining fixture, HarfBuzz         |
| [`@rtl-resolver/icons`](./packages/icons) / [`motion`](./packages/motion)                                     | Mirror policies and logical start/end motion          |
| [`@rtl-resolver/adapters`](./packages/adapters) / [`testing`](./packages/testing)                             | Forms, tables, LTR/RTL test helpers                   |
| [`@rtl-resolver/mui`](./packages/mui) / [`radix`](./packages/radix) / [`headless-ui`](./packages/headless-ui) | Direction + dialog/menu/popover/select wrappers       |

```sh
npm install @rtl-resolver/core @rtl-resolver/react @rtl-resolver/browser
npm install @rtl-resolver/css @rtl-resolver/cli
```

## Development

Requires Node 20+. CI runs 20 and 22.

```sh
npm ci
npm test
npm run build
npm run build:workspaces
npm run check:size
npm run check:exports
npm run verify:release    # typecheck, tests, builds, size, exports, Unicode suites
```

`verify:release` does not run Playwright, Storybook, or screen readers.
`verify:full` adds Chromium Playwright and the Storybook example. VoiceOver and
NVDA jobs exist and are unproven on hosted runners.

Coordinated 0.2.0 publishing: [`RELEASE_POLICY.md`](./RELEASE_POLICY.md).
Latest numbers: [`docs/RUN_RESULTS.md`](./docs/RUN_RESULTS.md).

## License

MIT
