# Contributing

Thanks for helping improve `rtl-resolver`.

## Development

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

## Pull requests

Describe the behavior change, compatibility impact, and verification performed.
For algorithm changes, reference the relevant UAX #9 rule or Unicode data file.

