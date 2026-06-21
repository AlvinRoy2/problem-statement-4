import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  envDir: '../',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/health': 'http://localhost:4000',
      '/api': 'http://localhost:4000'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
})
