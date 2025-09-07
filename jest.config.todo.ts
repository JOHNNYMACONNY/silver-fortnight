import type { Config } from 'jest';

const config: Config = {
  displayName: 'TODO Unit Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/todo', '<rootDir>/tests/todo'],
  testMatch: [
    '<rootDir>/tests/todo/**/*.test.ts',
    '<rootDir>/tests/todo/**/*.test.tsx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.todo.json',
      isolatedModules: true
    }]
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/todo/**/*.ts',
    '!src/todo/index.ts',
    '!src/todo/**/*.d.ts',
    '!src/todo/**/__tests__/**'
  ],
  coverageDirectory: 'coverage/todo',
  coverageReporters: ['text', 'lcov', 'json'],
  moduleNameMapper: {},
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  maxWorkers: '50%',
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};

export default config;