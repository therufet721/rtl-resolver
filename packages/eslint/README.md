# @rtl-resolver/eslint

Provides `no-physical-direction` and `no-directional-assumptions` rules for
flat or legacy ESLint configurations. The second rule flags direct
`scrollLeft`, physical arrow-key handling, and hard-coded `dir="ltr"` so those
paths can use the browser/core helpers.

Start with `no-physical-direction` to flag common left/right style assumptions
in JSX and JavaScript style objects.
