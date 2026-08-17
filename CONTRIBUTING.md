# Contributing

Thanks for helping improve `rtl-resolver`.

## Development

Requires Node 20 or newer.

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Changes to the bidi engine should also run the official Unicode suites:

```sh
npm run test:bidi:conformance
```

Please include focused tests for behavior changes. Keep generated Unicode data
reproducible through the pinned manifest and do not commit `.cache/unicode/`.

`npm run verify:release` is the default gate. `npm run verify:full` also runs
Chromium Playwright and the Storybook build. Neither command runs VoiceOver or
NVDA.

## Pull requests

Describe the behavior change, compatibility impact, and verification performed.
For algorithm changes, reference the relevant UAX #9 rule or Unicode data file.
