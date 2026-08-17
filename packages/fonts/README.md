# @rtl-resolver/fonts

Deterministic script detection, advisory fallback descriptors, and TrueType/
OpenType `cmap` coverage. `shapeWithHarfbuzz()` runs HarfBuzz WASM for glyph
IDs and advances. `arabicJoiningFont()` is a committed GSUB isol/init/medi/fina
fixture; cmap-only fonts still report `joined: false`. `analyzeFontCoverage()`
records GSUB/GPOS/GDEF presence and WOFF2 directory transform flags. WOFF2 unwrap
reconstructs transformed empty/simple `glyf`/`loca` and `hmtx`. Composite glyphs
are skipped so cmap coverage can still succeed.
