import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        guides: resolve(import.meta.dirname, 'guides.html'),
        resources: resolve(import.meta.dirname, 'resources.html'),
        checklist: resolve(import.meta.dirname, 'checklist.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
      },
    },
  },
});
