import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: [
        resolve(__dirname),
      ]
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/Penna.js'),
      name: 'Penna',
      formats: ['umd'],
      fileName: () => `penna.min.js`
    },
    outDir: './dist',
    minify: 'terser',
  },
  css: {
    preprocessorOptions: {
      scss: {

      }
    }
  }
});
