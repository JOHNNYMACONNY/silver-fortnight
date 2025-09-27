module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Do NOT load jsdom-specific setup to avoid referencing window in Node env
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'node',
          allowJs: true,
          strict: true,
          isolatedModules: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
        },
        babelConfig: {
          plugins: [
            '@babel/plugin-syntax-import-meta',
            ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
          ],
        },
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['node_modules/(?!(firebase|@firebase)/)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  verbose: true,
};
