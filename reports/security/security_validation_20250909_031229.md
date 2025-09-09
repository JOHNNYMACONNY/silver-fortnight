# Firebase Security Rules Validation Report
Generated: Tue Sep  9 03:12:38 PDT 2025

## Validation Results

### Syntax Validation
No lint output produced in this run.
No lint output produced in this run.

### Security Tests

> test:security
> npm run security:test


> security:test
> jest --config jest.config.security.js

ReferenceError: require is not defined
    at file:///Users/johnroberts/TradeYa%20Exp/jest.config.security.js:2:33
    at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
    at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
    at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
    at Module._compile (node:internal/modules/cjs/loader:1712:5)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)

### Coverage Analysis

> test:security
> npm run security:test --coverage

npm warn Unknown cli config "--coverage". This will stop working in the next major version of npm.

> security:test
> jest --config jest.config.security.js

ReferenceError: require is not defined
    at file:///Users/johnroberts/TradeYa%20Exp/jest.config.security.js:2:33
    at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
    at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
    at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
    at Module._compile (node:internal/modules/cjs/loader:1712:5)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)

### Security Issues
npm error could not determine executable to run
npm error A complete log of this run can be found in: /Users/johnroberts/.npm/_logs/2025-09-09T10_12_35_192Z-debug-0.log

## Recommendations
