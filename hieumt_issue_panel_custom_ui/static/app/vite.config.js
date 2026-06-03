import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Forge Custom UI: paths must be relative (./assets/...), not /assets/...
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    // HMR trong iframe Jira + forge tunnel
    hmr: {
      host: 'localhost',
      port: 5173
    }
  },
  build: {
    outDir: 'build',
    emptyOutDir: true
  }
});
