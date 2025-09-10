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
    sourcemap: true,
    rollupOptions: {
        output: {
        manualChunks(id: string) {
          if (!id) return undefined;
          // vendor packages
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui/react-icons')) return 'radix-icons';
            if (id.includes('tailwind-merge')) return 'tailwind-merge';
            if (id.includes('framer-motion') || id.includes('motion-dom')) return 'vendor';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('firebase')) return 'firebase';
          }

          // local heavy modules: performance utilities
          if (id.includes('/src/services/performance/') || id.includes('/src/utils/performance/')) {
            return 'performance';
          }

          // split heavy pages into their own chunks
          if (id.includes('/src/pages/ProfilePage')) return 'profile-page';
          if (id.includes('/src/pages/TradeDetailPage')) return 'trade-detail-page';

          // group gamification UI components into their own chunk
          if (id.includes('/src/components/gamification/')) return 'gamification';

          // default: let Rollup decide
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
