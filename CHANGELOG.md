# Changelog

All notable changes to `rtl-resolver` are documented here.

## [0.1.0] - 2026-08-16

### Added

- Lightweight locale, text-direction, logical-side, and isolation helpers.
- Full Unicode Bidirectional Algorithm engine under `rtl-resolver/bidi`.
- Unicode 17.0.0 classification, bracket, and mirroring data with hash-verified generation.
- Paragraph, isolate, explicit formatting, weak/neutral, implicit-level, line, and visual-order processing.
- Code-point and UTF-16 offsets, logical/visual mappings, and `BidiRun` diagnostics.
- ASCII/LTR fast path and combining-mark-safe optional L3 handling.
- Official Unicode conformance runners and an offline smoke fixture.

### Verification

- 59 local tests passing.
- `BidiCharacterTest.txt`: 91,707 cases, 0 failures.
- `BidiTest.txt`: 770,241 cases, 0 failures.

