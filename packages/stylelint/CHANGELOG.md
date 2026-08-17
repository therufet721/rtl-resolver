# Changelog

## 0.2.0 — 2026-08-17

First coordinated npm release. The `stylelint` peer is optional; the plugin is
duck-typed and never imports Stylelint.

## 0.1.0 — 2026-08-17

Stylelint rule for physical CSS. `--fix` rewrites safe margin/padding/border
and `text-align`; positioning stays review-only. `:export`, `:import`, and
`composes` are ignored. `createPlugin` wraps the rule for Stylelint's plugin
factory.
