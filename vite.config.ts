import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    target: 'es2020',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
