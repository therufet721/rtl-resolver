# Make an existing LTR application RTL-ready

This guide is the intended path for adopting `rtl-resolver` incrementally.

## 1. Measure the work

```sh
npx rtl-resolver init
npx rtl-resolver audit ./src --write-baseline --baseline .rtl-resolver-baseline.json
npx rtl-resolver audit ./src --baseline .rtl-resolver-baseline.json --strict
```

Existing findings stay in the baseline. New physical CSS, style objects, and
hard-coded `dir="ltr"` fail CI.

## 2. Establish a direction source

Resolve **page** and **UI** direction from locale. Resolve **content** from text.

```ts
import { getDirection, resolveContextDirection } from "@rtl-resolver/core";
import { DirectionProvider } from "@rtl-resolver/react";

<DirectionProvider locale="ar-SA">
  <App />
</DirectionProvider>
```

Use `getDirectionAttributes()` on a generic React SSR document shell so SSR and
the client agree. In a Next.js App Router root layout, resolve `dir`/`lang`
with `@rtl-resolver/next` and wrap the tree in a Client Component that renders
`DirectionProvider` — the React/MUI/Radix/Headless packages are `"use client"`
modules and cannot be called as Server Component logic.

## 3. Isolate mixed content instead of reversing the DOM

```ts
import { isolateIfNeeded, needsIsolation } from "@rtl-resolver/core";
import { shouldReverseDomOrder } from "@rtl-resolver/adapters";

shouldReverseDomOrder(); // always { reverse: false }
isolateIfNeeded("John Smith", "rtl");
```

## 4. Convert layouts with logical CSS

```sh
npx rtl-resolver migrate ./src --dry-run --report
npx rtl-resolver migrate ./src --fix
```

Safe: margin/padding/border/text-align in CSS, CSS Modules, tagged templates,
and style objects. Review: `left`/`right`, `translateX`, `float`, directional
gradients, four-value padding/margin/inset. Same-file identifier spreads and
computed string keys are analyzed. Interpolations are not executed.

## 5. Normalize scroll, keyboard, and gestures

Use `@rtl-resolver/browser` logical scroll positions, `resolveArrowNavigation`
(`logical` vs `physical`), and `createSwipeRecognizer`.

## 6. Icons, motion, fonts

Mirror only icons with `policy: "mirrors"`. Leave logos, clocks, checkmarks,
reply, and send unmirrored. Prefer `logicalSlideIn` for directional motion and
`logicalFade` for direction-neutral animation. Run `rtl-resolver fonts` on
TTF/OTF/WOFF/WOFF2. Joining still depends on the font's GSUB features;
`arabicJoiningFont()` is the committed proof fixture.

## 7. Test both directions

```ts
import { browserDirectionTest, SCRIPT_FIXTURES, visualRegressionMatrix } from "@rtl-resolver/testing";
```

`SCRIPT_FIXTURES` contains genuine Arabic, Hebrew, Persian, and Urdu strings.
`visualRegressionMatrix()` is the desktop/mobile (optional tablet) screenshot grid.
It does not launch browsers; pair it with Playwright in the application.

## 8. Keep regressions out of CI

```sh
npx rtl-resolver lint ./src --baseline .rtl-resolver-baseline.json
npx rtl-resolver test
```
