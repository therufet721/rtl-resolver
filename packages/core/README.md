# @rtl-resolver/core

Framework-independent direction helpers and the full Unicode Bidirectional
Algorithm engine extracted from `rtl-resolver`.

The engine lives on a separate subpath so the lightweight index stays under the
size budget:

```ts
import { analyzeBidi, resolveBidiLevels } from "@rtl-resolver/core/bidi";
import { validateRTLPlugin } from "@rtl-resolver/core/plugin";
```

This package is the canonical implementation. The root `rtl-resolver` package
re-exports it from source for existing import paths and therefore ships a
second copy of the bidi tables. Prefer this package for new installs.
