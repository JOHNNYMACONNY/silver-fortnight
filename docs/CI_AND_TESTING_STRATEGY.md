# CI and Testing Strategy

This document summarizes the current CI and testing setup changes applied to stabilize builds and speed up feedback.

## What Changed

- Jest now supports TS/TSX/JS/JSX via ts-jest and babel-jest
  - Added `babel.config.cjs` (CommonJS) to work in an ESM repo (package.json has `"type": "module"`).
  - `jest.config.ts` transforms:
    - `ts/tsx` with ts-jest (with Babel plugins for `import.meta` and CJS transform)
    - `js/jsx` with babel-jest

- CI test scope
  - `npm run test:ci`: runs unit + migration + security suites, ignoring heavy integration/UI tests. Uses `--maxWorkers=50%` for stability.
  - `npm run test:ci:full`: runs the full test suite (use for nightly/manual runs).

## Commands

```bash
# Fast CI (PRs)
npm run test:ci

# Full suite (nightly/manual)
npm run test:ci:full
```

## Rationale

- Keep PR CI green and fast by skipping heavy/flaky UI/integration suites.
- Run comprehensive tests separately to catch regressions without blocking day-to-day merges.

## Follow-ups (Optional)

- Split Jest into projects (unit, integration, migration, security) for finer control per workflow.
- Re-enable specific integration folders gradually as they stabilize.


