const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/utils/__tests__/jest.setup.ts"],
  injectGlobals: true,
  moduleNameMapper: {
    // Style and asset mocks
    "\\.(css|less|sass|scss)$": "<rootDir>/src/utils/__tests__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|webp|svg)$":
      "<rootDir>/src/utils/__tests__/fileMock.js",

    // Other module mocks
    "^vite$": "<rootDir>/src/utils/__mocks__/viteMock.ts",

    // Mock firebase-config to avoid import.meta issues
    "^../../../firebase-config$": "<rootDir>/src/__mocks__/firebase-config.ts",
    "^../../firebase-config$": "<rootDir>/src/__mocks__/firebase-config.ts",
    "^../firebase-config$": "<rootDir>/src/__mocks__/firebase-config.ts",
    // Map rules unit testing to CJS shim for Jest compatibility
    "^@firebase/rules-unit-testing$": "<rootDir>/src/types/firebase-test.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@contexts/(.*)$": "<rootDir>/src/contexts/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          module: "esnext", // Keep as esnext for Vite compatibility
          moduleResolution: "node",
          allowJs: true,
          strict: true,
          isolatedModules: true, // Keep true if using esbuild or similar
          skipLibCheck: true,
          types: ["jest", "node"],
        },
        // Add babelConfig to handle import.meta
        babelConfig: {
          plugins: [
            "@babel/plugin-syntax-import-meta",
            [
              "@babel/plugin-transform-modules-commonjs",
              { allowTopLevelThis: true },
            ],
          ],
        },
      },
    ],
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "jest.setup.ts",
    "setupEnv.ts",
  ],
  moduleDirectories: ["node_modules", "src"],
  roots: ["<rootDir>/src"],
  resetMocks: false,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/reportWebVitals.ts",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  verbose: true,
  transformIgnorePatterns: ["node_modules/(?!(firebase|@firebase)/)"],
  testEnvironmentOptions: {
    url: "http://localhost",
    customExportConditions: ["node", "node-addons"],
  },
} as const;

export default config;
