# Firebase Security Rules Validation Report
Generated: Tue Sep  9 03:23:47 PDT 2025

## Validation Results

### Syntax Validation
No lint output produced in this run.
No lint output produced in this run.

### Security Tests

> test:security
> npm run security:test


> security:test
> jest --config jest.config.security.cjs

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/johnroberts/TradeYa Exp/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL security src/__tests__/firebase-security.test.ts
  ● Test suite failed to run

    ReferenceError: Cannot access 'mockTestEnv' before initialization

      28 | }));
      29 | const rulesTesting = require('@firebase/rules-unit-testing');
    > 30 | rulesTesting.initializeTestEnvironment.mockResolvedValue(mockTestEnv);
         |                                                          ^
      31 | rulesTesting.assertSucceeds.mockImplementation(async (p) => await p);
      32 | rulesTesting.assertFails.mockImplementation(async (p) => { try { await p; throw new Error('Operation allowed'); } catch { return; } });
      33 |

      at Object.<anonymous> (jest.setup.ts:30:58)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.925 s
Ran all test suites.

### Coverage Analysis

> test:security
> npm run security:test --coverage

npm warn Unknown cli config "--coverage". This will stop working in the next major version of npm.

> security:test
> jest --config jest.config.security.cjs

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/johnroberts/TradeYa Exp/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL security src/__tests__/firebase-security.test.ts
  ● Test suite failed to run

    ReferenceError: Cannot access 'mockTestEnv' before initialization

      28 | }));
      29 | const rulesTesting = require('@firebase/rules-unit-testing');
    > 30 | rulesTesting.initializeTestEnvironment.mockResolvedValue(mockTestEnv);
         |                                                          ^
      31 | rulesTesting.assertSucceeds.mockImplementation(async (p) => await p);
      32 | rulesTesting.assertFails.mockImplementation(async (p) => { try { await p; throw new Error('Operation allowed'); } catch { return; } });
      33 |

      at Object.<anonymous> (jest.setup.ts:30:58)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.639 s
Ran all test suites.

### Security Issues
npm error could not determine executable to run
npm error A complete log of this run can be found in: /Users/johnroberts/.npm/_logs/2025-09-09T10_23_43_478Z-debug-0.log

## Recommendations
