# Changelog

## 0.2.0 — 2026-08-17

First coordinated npm release.

## 0.1.0 — 2026-08-17

`audit`, `lint`, `migrate`, `init`, `fonts`, and `test` commands. Safe migrate
rewrites CSS and CSS-in-JS margin/padding/border/`text-align` only. It does not
rewrite `left`/`right`. Configured plugins are validated and may contribute
`audit` and `migrate` hooks.
