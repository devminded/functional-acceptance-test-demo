import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const API_SERVER = 'http://localhost:3000';

const page = (file: string): string => fileURLToPath(new URL(`./src/web/${file}`, import.meta.url));

export default defineConfig({
  root: 'src/web',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: { home: page('index.html'), signIn: page('sign-in.html') },
    },
  },
  server: {
    proxy: { '/api': API_SERVER },
  },
});
