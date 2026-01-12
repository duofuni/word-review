import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/word-review/',
  plugins: [react()],
  build: {
    outDir: 'docs'
  },
  server: {
    port: 3001,
    open: true
  }
})
