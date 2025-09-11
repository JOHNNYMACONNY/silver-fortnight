// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
// import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

export default tseslint.config(
  {
    // 1. Base configuration for all files
    ignores: [
      "dist", 
      "node_modules", 
      ".DS_Store", 
      "coverage", 
      "storybook-static", 
      "jest-html-reporters-attach",
      "playwright-report",
      "**/*.cjs",
      "coverage-scripts",
      "coverage/staging-migration",
      "reports/security",
      "coverage/migration-html-report",
      "debug-test.js",
      "fixCreatedAt.js",
      "create-sample-data.js",
      "create-test-notifications.js",
      "debug-leaderboard.js",
      "debug-notifications.js",
    ],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "storybook": storybook,
    },
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
    }
  },
  {
    // 2. Stricter rules for application source code
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.app.json",
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // 3. Relaxed rules for configuration files
    files: ["*.config.{js,ts}", "scripts/**/*.{js,ts}", "dev-setup.js"],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // 4. Relaxed rules for tests
    files: ['src/**/__tests__/**/*.{ts,tsx,js}', 'src/**/*.test.{ts,tsx,js,jsx}', 'e2e/**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // 5. Relaxed rules for Storybook files
    files: ["src/**/*.stories.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      ...storybook.configs.recommended.overrides[0].rules,
    },
  }
);
