import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@services': resolve(__dirname, './src/services'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@config': resolve(__dirname, './src/config'),
      '@assets': resolve(__dirname, './src/assets'),
      '@lib': resolve(__dirname, './src/lib'),
      '@stories': resolve(__dirname, './src/stories'),
      '@test': resolve(__dirname, './src/test'),
      '@scripts': resolve(__dirname, './scripts')
    }
  },

  server: {
    port: 5174,
    host: true,
    open: false
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
