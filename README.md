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

## Advanced bidi engine

The full Unicode-direction pipeline is available from a separate subpath so the
lightweight API does not load the Unicode tables:

```ts
import {
  analyzeBidi,
  resolveBidiLevels,
  reorderBidi,
  mirroredCodePoint
} from "rtl-resolver/bidi";

const result = analyzeBidi("Hello שלום", { baseDirection: "auto" });
const line = result.paragraphs[0].lines[0];

line.visualToLogical; // visual position -> logical code-point offset
line.logicalToVisual; // logical offset -> visual position, or -1 if X9-removed
resolveBidiLevels("مرحبا 123");
reorderBidi("Hello שלום"); // diagnostic output; do not render this string directly in HTML
mirroredCodePoint(0x28); // 0x29
```

The engine works on Unicode code points internally and exposes both code-point
and UTF-16 document offsets. Pass `lineEnds` when a layout engine has already
wrapped a paragraph:

```ts
analyzeBidi("first line אבג second", { lineEnds: [15] });
```

`reorderBidi()` is intended for custom renderers, diagnostics, terminals, and
canvas-like consumers. Browsers already apply bidi layout; inserting an
already-reordered string into a bidi-aware DOM can reorder it twice.

By default the reordering matches the UAX #9 reference output. Pass
`applyL3: true` to keep combining marks beside their base character, which is
what a renderer that draws marks after the base needs:

```ts
analyzeBidi("א(ב)̱", { applyL3: true });
```

### Conformance

The engine passes both official Unicode 17.0.0 conformance suites with zero
failures:

| Suite | Cases | Failures |
| --- | --- | --- |
| `BidiCharacterTest.txt` | 91,707 | 0 |
| `BidiTest.txt` | 770,241 | 0 |

Run them with `npm run test:bidi:conformance`, which downloads and hash-verifies
the pinned Unicode files before building and testing. `prepublishOnly` runs the
same gate, so a regression in either suite blocks publishing. `npm test` also
runs a committed offline subset of `BidiCharacterTest.txt` in
`test/bidi/conformance-smoke.json`, regenerated with `npm run unicode:smoke`.

## Development

```sh
npm install
npm test
npm run build
```

## License

MIT
