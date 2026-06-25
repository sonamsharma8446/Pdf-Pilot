import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      // Proxy all /api requests to the Express server so they are same-origin
      // from the browser's perspective. This eliminates CORS preflight round-trips
      // for large multipart uploads, which was causing intermittent request aborts
      // when desktop-sized images were uploaded.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // No rewrite needed — Express mounts routes under /api already.
      },
    },
  },
})
