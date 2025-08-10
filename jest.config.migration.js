const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/scripts'],
  testMatch: [
    '**/__tests__/migration/**/*.test.ts',
    '**/migration/**/*.test.ts',
  ],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        target: 'ES2020',
        module: 'commonjs'
      },
    }],
  },
  moduleNameMapper: {
    '^@firebase/(.*)$': '<rootDir>/node_modules/@firebase/$1',
    '^../../../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts',
    '^../../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts',
    '^../firebase-config$': '<rootDir>/src/utils/__mocks__/firebase-config.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/utils/__tests__/jest.setup.ts'],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageDirectory: 'coverage/migration',
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/migration-html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
};

export default config;
