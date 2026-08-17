# @rtl-resolver/stylelint

Stylelint plugin for flagging physical CSS properties that commonly break RTL.
Safe margin/padding/border and `text-align: left|right` can be autofixed via
Stylelint `--fix`. `left`/`right` positioning, transforms, gradients, and
shadows stay review-only. CSS Modules `:export`, `:import`, and `composes` are
ignored.

```js
import stylelint from "stylelint";
import { createPlugin, ruleName } from "@rtl-resolver/stylelint";

export default createPlugin(stylelint.createPlugin);
```

The default export still exposes the 4-argument `noPhysicalDirection` rule for
tests and custom runners.
