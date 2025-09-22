const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/utils/__tests__/jest.setup.ts'
  ],
  injectGlobals: true,
  moduleNameMapper: {
    // Style and asset mocks
    '\\.(css|less|sass|scss)$': '<rootDir>/src/utils/__tests__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/utils/__tests__/fileMock.js',
    
    // React module mapping
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    
    // Firebase module mapping - temporarily disabled to test explicit mocks
    // '^firebase/firestore$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^firebase/auth$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^firebase/storage$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^firebase/app$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^firebase$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^@firebase/firestore$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^@firebase/auth$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    // '^@firebase/storage$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
    
    // Other module mocks
    '^vite$': '<rootDir>/src/utils/__mocks__/viteMock.ts',
    
    // Mock firebase-config to avoid import.meta issues
  '^../../../firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  '^../../firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  '^../firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  '^./firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  '^firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  '^@/firebase-config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  // Accept both dash and underscore variants used across tests
  '^(.*/)?firebase[_-]config$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  // Match any firebase-config import
  '^.*firebase-config.*$': '<rootDir>/src/__mocks__/firebase-config-simple.js',
  // Provide common mocks for problematic third-party modules used in jest.mock factories
  '^framer-motion$': '<rootDir>/src/utils/__mocks__/framer-motion.js',
  '^vitest$': '<rootDir>/src/utils/__mocks__/vitest.js'
  ,
  // Support TS path alias for src as @/
  '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        module: 'esnext', // Keep as esnext for Vite compatibility
        moduleResolution: 'node',
        allowJs: true,
        strict: true,
        isolatedModules: true, // Keep true if using esbuild or similar
        skipLibCheck: true,
        types: ['jest', 'node']
      },
      // Add babelConfig to handle import.meta and JSX
      babelConfig: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript'
        ],
        plugins: [
          '@babel/plugin-syntax-import-meta',
          ['@babel/plugin-transform-modules-commonjs', { 'allowTopLevelThis': true }]
        ]
      }
    }]
  },
  // Make global mocks available in jest.mock() factories
  globals: {
    'ts-jest': {
      useESM: true
    },
    // Make our global mocks available in jest.mock() factories
    jsx_runtime_1: {
      jsx: (type: any, props: any, key?: any) => ({ type, props, key }),
      jsxs: (type: any, props: any, key?: any) => ({ type, props, key }),
      Fragment: 'Fragment'
    },
    react_1: {
      default: 'React',
      createElement: 'React.createElement',
      Fragment: 'React.Fragment',
      useState: 'React.useState',
      useEffect: 'React.useEffect',
      useContext: 'React.useContext',
      useReducer: 'React.useReducer',
      useCallback: 'React.useCallback',
      useMemo: 'React.useMemo',
      useRef: 'React.useRef',
      useImperativeHandle: 'React.useImperativeHandle',
      useLayoutEffect: 'React.useLayoutEffect',
      useDebugValue: 'React.useDebugValue'
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'jest.setup.ts',
  'setupEnv.ts',
  '<rootDir>/src/__tests__/quarantine/'
  ],
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>/src'],
  resetMocks: false,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons']
  }
} as const;

export default config;
