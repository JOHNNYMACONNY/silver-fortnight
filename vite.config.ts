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
    port: 5175,
    host: true,
    open: false
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for faster builds
    minify: 'terser', // Use terser for better compression
    rollupOptions: {
        output: {
        manualChunks(id: string) {
          if (!id) return undefined;
          
          // Optimized vendor chunking for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('react-router')) return 'vendor-router';
            // Group all other vendor packages
            return 'vendor';
          }

          // Split heavy pages into their own chunks
          if (id.includes('/src/pages/ProfilePage')) return 'page-profile';
          if (id.includes('/src/pages/TradeDetailPage')) return 'page-trade-detail';
          if (id.includes('/src/pages/LoginPage')) return 'page-login';

          // Group UI components
          if (id.includes('/src/components/gamification/')) return 'components-gamification';
          if (id.includes('/src/components/ui/')) return 'components-ui';

          // Default: let Rollup decide
          return undefined;
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
