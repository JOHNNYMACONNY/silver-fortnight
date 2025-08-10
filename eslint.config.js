// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config(storybook.configs.recommended),
  {
    ignores: ["dist", "node_modules", ".DS_Store", "coverage", "storybook-static", "jest-html-reporters-attach"],
  },
  {
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])
        ),
        ...globals.node,
      }
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
    },
  },
  {
    files: ['src/utils/__tests__/**/*.js', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off', 
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^(module|require|__dirname)$' }],
    },
  }
);
