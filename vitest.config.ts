import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/*',
      ],
      include: ['src/**/*.{ts,tsx}']
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    deps: {
      inline: [/@firebase/]
    },
    alias: {
      '@': resolve(__dirname, './src')
    },
    testTimeout: 10000,
    watch: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
