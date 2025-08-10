/** @type {import('jest').Config} */
module.exports = {
  // Basic Configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test Files
  testMatch: [
    '<rootDir>/scripts/staging-migration-validation.ts',
    '<rootDir>/src/__tests__/migration/**/*.test.ts',
    '<rootDir>/src/__tests__/migration/**/*.test.tsx'
  ],
  
  // TypeScript Configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false,
        moduleResolution: 'node'
      }
    }]
  },
  
  // Module Resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1'
  },
  
  // Mock Configuration
  setupFilesAfterEnv: ['<rootDir>/src/utils/__tests__/setupEnv.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // File Mocks
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/utils/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/utils/__mocks__/fileMock.js'
  },
  
  // Environment Setup
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'scripts/staging-migration-validation.ts',
    'scripts/production/**/*.ts',
    'src/services/migration/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage/staging-migration',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Performance Configuration
  maxWorkers: '50%',
  testTimeout: 60000, // 60 seconds for staging validation tests
  
  // Staging-Specific Configuration
  globals: {
    'ts-jest': {
      isolatedModules: true
    },
    STAGING_ENVIRONMENT: true,
    MIGRATION_TEST_MODE: true
  },
  
  // Reporter Configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/staging-migration',
      filename: 'staging-validation-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'TradeYa Staging Migration Validation Report'
    }]
  ],
  
  // Verbose Output for Staging Validation
  verbose: true,
  
  // Error Handling
  errorOnDeprecated: false,
  bail: false, // Continue running tests even if some fail
  
  // Mock Configuration for Firebase
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)'
  ]
};
