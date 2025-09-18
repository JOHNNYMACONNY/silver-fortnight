## Fix: Jest setup initialization error

Date: 2025-09-18

Summary:

- The security pipeline failed due to a test setup error: `ReferenceError: Cannot access 'mockTestEnv' before initialization` originating from `jest.setup.ts` when mocking `@firebase/rules-unit-testing`.
- Root cause: `jest.mock(...)` is hoisted by Jest and the mock factory ran before the `mockTestEnv` constant was initialized in the module.

What I changed:

- Replaced the hoisted `jest.mock("@firebase/rules-unit-testing", ...)` with `jest.doMock(...)` so the mock factory runs at runtime after `mockTestEnv` is defined. This prevents the initialization order issue.
- Adjusted TypeScript/Jest declarations in `jest.setup.ts` to avoid type-checker errors when running outside of a full Jest type environment.

Verification:

- Installed dev dependencies and ran `npm run security:test`.
- All security tests passed locally: 1 test suite, 9 tests — all passed.

Next steps / Notes:

- This is a low-risk change that only affects test setup. No production code was modified.
- If other tests rely on hoisting behavior, review them for similar issues. Consider adding a short note in contributor docs about avoiding hoisted mocks that depend on runtime-initialized variables.

Files changed:

- `jest.setup.ts` (mocking updated to `jest.doMock`) 
- `reports/security/2025-09-18-fix-jest-setup.md` (this file)

Commit: Please commit the changes and rerun CI to ensure the pipeline now passes.
