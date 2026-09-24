import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// /api/* is forwarded to the FastAPI service during development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
