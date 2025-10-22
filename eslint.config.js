// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import security from "eslint-plugin-security";

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
    ignores: [
      "dist", 
      "node_modules", 
      ".DS_Store", 
      "coverage", 
      "storybook-static", 
      "jest-html-reporters-attach",
      "src/__tests__/**/*.test.tsx",
      "src/__tests__/**/*.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
      "src/stories/**/*.stories.tsx",
      "src/utils/__tests__/**",
      "src/services/performance/__tests__/**",
      "src/utils/development/__tests__/**",
      "src/__tests__/**",
      "src/components/ui/stories/**",
      "src/components/features/challenges/ChallengeCard.stories.tsx",
      "src/auth/secureRoutes.tsx"
    ],
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
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.app.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-useless-escape": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-unused-disable-directives": "off",
      "no-constant-condition": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "@typescript-eslint/no-namespace": "warn",
    },
  },
  {
    files: ["vite.config.ts", "tailwind.config.ts", "jest.config.ts", "playwright.config.ts"],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["functions/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
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
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "security": security,
    },
    rules: {
      ...security.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off", // Allow any in security contexts
    },
  },
  {
    files: ["src/utils/__mocks__/**/*.{ts,tsx}", "src/utils/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in test files
    },
  }
);
