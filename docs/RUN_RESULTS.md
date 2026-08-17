# Current verification results

Last verified on 2026-08-17 from the 0.2.0 workspace checkout.

## Summary

- 16 workspace packages, all versioned 0.2.0.
- Root and workspace typechecks pass.
- 125/125 unit tests pass across 28 files.
- Root and all workspace ESM/CJS builds pass.
- ESLint and all published-entry raw/gzip size budgets pass.
- `BidiCharacterTest.txt`: 91,707 cases, 0 failures.
- `BidiTest.txt`: 770,241 cases, 0 failures.
- All five Unicode 17.0.0 inputs pass committed SHA-256 verification.

## Benchmark snapshot

Vitest benchmark inputs are 100 repeated strings. Results vary by host and are
diagnostic rather than release thresholds.

| Bench                            |    Operations/second |
| -------------------------------- | -------------------: |
| ASCII `resolveBidiLevels`        | approximately 33,599 |
| Mixed `analyzeBidi`              |  approximately 1,209 |
| `bidi-js` mixed embedding levels |  approximately 4,378 |

The comparison is not a correctness oracle: rtl-resolver and `bidi-js` expose
different analysis contracts and use different Unicode data versions.

## Current root artifacts

| Entry                 | Format |       Raw |     Gzip |
| --------------------- | ------ | --------: | -------: |
| `rtl-resolver`        | ESM    |   5,680 B |  1,780 B |
| `rtl-resolver`        | CJS    |   7,537 B |  2,297 B |
| `rtl-resolver/bidi`   | ESM    | 217,554 B | 12,803 B |
| `rtl-resolver/plugin` | ESM    |   1,002 B |    423 B |
| `rtl-resolver/plugin` | CJS    |   2,047 B |    807 B |

`scripts/check-package-size.mjs` records and checks every workspace entry, not
only the four root artifacts shown here.

## External proof still pending

- Native VoiceOver and NVDA hosted-runner execution.
- The first live coordinated npm publish with provenance.

Historical 59-test/no-CI/no-competitor reports describe the pre-ecosystem
checkout and are not the current release evidence.
