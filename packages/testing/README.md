# @rtl-resolver/testing

Small dependency-free helpers for running the same fixture in LTR, RTL, and
auto modes. Playwright and Storybook integrations can build on these values.
# Direction matrix helpers

```ts
await rtlTest(async ({ direction }) => {
  // run the same fixture with direction === "rtl"
});
await directionTest(async ({ direction }) => {
  // runs ltr, rtl, and auto
});
```

`assertPageDirection()` and `createDirectionDecorator()` are adapters without
runtime dependencies on Playwright or Storybook.

VoiceOver and NVDA jobs live in `playwright.voiceover.config.ts` and
`playwright.nvda.config.ts`. They require the matching OS plus `RTL_AT` and a
Guidepup setup (`npx @guidepup/setup`). They are not Playwright role checks.
