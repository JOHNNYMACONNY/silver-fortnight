module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/scripts'],
  testMatch: [
    '<rootDir>/scripts/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/scripts/**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        module: 'commonjs',
        moduleResolution: 'node',
        allowJs: true,
        strict: true,
        isolatedModules: false,
        skipLibCheck: true,
        types: ['jest', 'node']
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,
  verbose: true,
  collectCoverageFrom: [
    'scripts/**/*.{ts,tsx}',
    '!scripts/**/*.d.ts',
    '!scripts/**/__tests__/**',
    '!scripts/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage-scripts',
  coverageReporters: ['text', 'lcov']
};