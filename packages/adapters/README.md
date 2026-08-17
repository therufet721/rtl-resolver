# @rtl-resolver/adapters

Logical placement helpers for overlays, menus, inputs, and tables. Use
`resolveInputDirection(uiDirection, value)` when text direction should differ
from the surrounding UI. Use `semanticColumnOrder()` for DOM/accessibility
order and `visualColumnOrder()` only in a renderer that intentionally controls
visual placement.

Optional library mappers (`muiThemeOptions`, `radixDirectionProps`,
`headlessUiDirectionProps`, `floatingUiPlacement`) return direction props.
Full wrappers that import those libraries live in `@rtl-resolver/mui`,
`@rtl-resolver/radix`, and `@rtl-resolver/headless-ui`.
