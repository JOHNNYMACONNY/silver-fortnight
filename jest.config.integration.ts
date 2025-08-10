import type { Config } from 'jest';

const config: Config = {
  displayName: 'Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.integration.test.{ts,tsx}',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/utils/__tests__/jest.setup.ts',
    '<rootDir>/src/__tests__/integration/setup.ts',
  ],
  
  // Module mapping
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/utils/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/utils/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts',
    '^../../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts',
    '^../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Roots
  roots: ['<rootDir>/src'],
  
  // Mock configuration
  resetMocks: false,
  restoreMocks: true,
  clearMocks: true,
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/utils/__tests__/**',
    // Focus on integration points
    'src/services/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/AuthContext.tsx',
    'src/contexts/**/*.{ts,tsx}',
  ],
  
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds for integration tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Higher thresholds for critical integration points
    'src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/AuthContext.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase|framer-motion)/)',
  ],
  
  // Timeout configuration
  testTimeout: 15000, // 15 seconds for integration tests
  
  // Verbose output
  verbose: true,
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/integration-html-report',
        filename: 'integration-report.html',
        expand: true,
        pageTitle: 'TradeYa Integration Test Report',
        logoImgPath: undefined,
        hideIcon: false,
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: 'reports/integration',
        outputName: 'integration-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        addFileAttribute: true,
      },
    ],
  ],
  
  // Global configuration
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
    INTEGRATION_TEST_MODE: true,
  },
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance configuration
  maxWorkers: '50%',
  
  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-integration',
  
  // Watch configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  
  // Snapshot configuration
  snapshotSerializers: [
    '@emotion/jest/serializer',
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Test result processor
  testResultsProcessor: undefined,
  
  // Notify configuration
  notify: false,
  notifyMode: 'failure-change',
  
  // Bail configuration
  bail: 0,
  
  // Force exit
  forceExit: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Silent mode
  silent: false,
  
  // Pass with no tests
  passWithNoTests: true,
  
  // Log heap usage
  logHeapUsage: false,
  
  // Max concurrency
  maxConcurrency: 5,
  
  // Random seed
  randomize: false,
  
  // Collect coverage on failure
  collectCoverageOnlyFrom: undefined,
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/build/',
    '/dist/',
    '/__tests__/',
    '/__mocks__/',
    '/src/utils/__tests__/',
    '/src/utils/__mocks__/',
  ],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/build/',
    '/dist/',
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Resolver
  resolver: undefined,
  
  // Runner
  runner: 'jest-runner',
  
  // Test runner
  testRunner: 'jest-circus/runner',
  
  // Test sequence
  testSequencer: '@jest/test-sequencer',
  
  // Unmocked module path patterns
  unmockedModulePathPatterns: undefined,
  
  // Use stderr
  useStderr: false,
  
  // Watch
  watch: false,
  watchAll: false,
  

} as const;

export default config;
