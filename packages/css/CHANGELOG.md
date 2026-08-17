# Changelog

## 0.2.0 — 2026-08-17

First coordinated npm release. The `postcss` peer is optional; the plugin is
duck-typed and never imports PostCSS.

## 0.1.0 — 2026-08-17

Physical-to-logical CSS analysis, tagged CSS-in-JS, Babel object ASTs, CSS
Modules ICSS chrome (`:export`, `:import`, `@value`, `composes`), `css()`
callbacks, `css`/`sx` props, kebab-case style keys, same-file identifier
spreads, computed string keys, and `migrateSource` for safe CSS-in-JS rewrites.
Interpolations and unknown factories are not executed. Four-value
padding/margin/inset shorthands are review-only.
