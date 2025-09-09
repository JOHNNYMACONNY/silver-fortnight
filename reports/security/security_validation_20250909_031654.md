# Firebase Security Rules Validation Report
Generated: Tue Sep  9 03:17:03 PDT 2025

## Validation Results

### Syntax Validation
No lint output produced in this run.
No lint output produced in this run.

### Security Tests

> test:security
> npm run security:test


> security:test
> jest --config jest.config.security.cjs

Error: Cannot find module './jest.config.js'
Require stack:
- /Users/johnroberts/TradeYa Exp/jest.config.security.cjs
- /Users/johnroberts/TradeYa Exp/node_modules/jest-util/build/requireOrImportModule.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-util/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/FailedTestsInteractiveMode.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/plugins/FailedTestsInteractive.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/watch.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/cli/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/build/run.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/bin/jest.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest/bin/jest.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/Users/johnroberts/TradeYa Exp/jest.config.security.cjs:5:6)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)

### Coverage Analysis

> test:security
> npm run security:test --coverage

npm warn Unknown cli config "--coverage". This will stop working in the next major version of npm.

> security:test
> jest --config jest.config.security.cjs

Error: Cannot find module './jest.config.js'
Require stack:
- /Users/johnroberts/TradeYa Exp/jest.config.security.cjs
- /Users/johnroberts/TradeYa Exp/node_modules/jest-util/build/requireOrImportModule.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-util/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/FailedTestsInteractiveMode.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/plugins/FailedTestsInteractive.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/watch.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/cli/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/@jest/core/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/build/run.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/build/index.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest-cli/bin/jest.js
- /Users/johnroberts/TradeYa Exp/node_modules/jest/bin/jest.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/Users/johnroberts/TradeYa Exp/jest.config.security.cjs:5:6)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)

### Security Issues
npm error could not determine executable to run
npm error A complete log of this run can be found in: /Users/johnroberts/.npm/_logs/2025-09-09T10_16_59_850Z-debug-0.log

## Recommendations
