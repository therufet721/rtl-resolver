# @rtl-resolver/react

SSR-safe React direction context built on `@rtl-resolver/core`. The published
module is a Client Component (`"use client"`). In a Next.js App Router root
layout, resolve `dir`/`lang` with `@rtl-resolver/next` and wrap the tree from a
Client Component that imports `DirectionProvider`.

```tsx
<DirectionProvider locale="ar-SA">
  <App />
</DirectionProvider>
```

`getDirectionAttributes({ locale: "ar-SA" })` is safe to call during SSR and
returns `{ dir: "rtl", lang: "ar-SA" }`. Persisted preferences are read only
after mount, avoiding hydration mismatches. Nested providers scope their
wrapper direction without replacing the document direction; pass
`manageDocument={true}` when a nested provider should explicitly own the
document shell.

Use semantic isolation and override elements without constructing HTML strings:

```tsx
import { Bdi, Bdo } from "@rtl-resolver/react";

<Bdi>{userSuppliedName}</Bdi>
<Bdo direction="rtl">known-order text</Bdo>
```

`Bdi` defaults to `dir="auto"`. React escapes children and attributes normally.
`Bdo` requires an explicit `ltr` or `rtl` direction because overrides should
never be inferred silently.
