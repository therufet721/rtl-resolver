# @rtl-resolver/cli

```sh
rtl-resolver init .
rtl-resolver audit ./src --strict
rtl-resolver test .
rtl-resolver audit ./src --write-baseline --baseline .rtl-resolver-baseline.json
rtl-resolver migrate ./src --dry-run --report
rtl-resolver migrate ./src --fix
rtl-resolver fonts ./assets/fonts
```

Migration is dry-run by default. Pass `--fix` only for mechanical CSS and
CSS-in-JS replacements (`css`/`styled` templates, `css()` objects, `style`/`sx`/`css`
props). `--dry-run` wins if both flags are present. Interpolations, unknown
factories, and `left`/`right` positioning are not rewritten. Configured plugins
may also contribute `audit` and `migrate` hooks; invalid plugins are skipped
after `validateRTLPlugin` diagnostics.

`fonts` reports scripts in text fixtures and, for `.ttf`/`.otf`/`.woff`/`.woff2`
files, cmap coverage marks (`yes` / `partial` / `no`). WOFF2 unwrap reconstructs
empty/simple `glyf`/`loca` and `hmtx`; composite glyphs are skipped. Joining
quality still depends on the font's GSUB features.
