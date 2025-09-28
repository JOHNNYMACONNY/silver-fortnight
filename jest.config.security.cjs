/** @type {import('ts-jest').JestConfigWithTsJest} */

// Minimal security-specific Jest config without inheriting base config
module.exports = {
  displayName: 'security',
  testMatch: [
    '**/__tests__/**/*.security.test.ts',
    '**/__tests__/**/firebase-security.test.ts'
  ],
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    "__FIREBASE_DEFAULTS__": {
      "config": {
        "projectId": "demo-test-project"
      }
    }
  },
  // Increase timeout for Firebase operations
  testTimeout: 10000,
  // Run tests in sequence
  maxConcurrency: 1,
  maxWorkers: 1,
  // Verbose output for debugging
  verbose: true,
  // Coverage configuration specific to security tests
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/__mocks__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: [
    'text',
    'lcov',
    'clover',
    ['json', { file: 'security-coverage.json' }]
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports/security',
      outputName: 'security-test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      addFileAttribute: true
    }]
  ],
  // Clean up test environment between runs
  setupFiles: [
  ],
  // Test environment configuration
  testEnvironmentOptions: {
    url: 'http://localhost',
    firestore: {
      host: 'localhost',
      port: 8080
    },
    storage: {
      host: 'localhost',
      port: 9199
    }
  }
};