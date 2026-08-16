# rtl-resolver

Dependency-free RTL and bidirectional-text helpers for JavaScript and TypeScript.

```sh
npm install rtl-resolver
```

```ts
import {
  directionFromLocale,
  directionFromText,
  inlineSides,
  isolate,
  resolveDirection
} from "rtl-resolver";

directionFromLocale("ar-EG"); // "rtl"
directionFromText("مرحبا بالعالم"); // "rtl"
resolveDirection({ direction: "auto", text: userInput, locale: userLocale });
inlineSides("rtl"); // { start: "right", end: "left" }
isolate("مرحبا", "rtl"); // safe embedding in mixed-direction text
```

## Resolution order

`resolveDirection()` uses an explicit `ltr`/`rtl` value first. In `auto` mode it checks the first strong character in `text`, then the customary direction of `locale`, and finally `fallback` (which defaults to `ltr`).

Prefer native CSS logical properties such as `margin-inline-start` and `padding-inline-end`. Use `inlineSides()` only when an API requires physical `left`/`right` values.

## Development

```sh
npm install
npm test
npm run build
```

## License

MIT
