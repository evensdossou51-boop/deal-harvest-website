import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': 'http://localhost:5001'
      }
    },
    build: {
      outDir: 'dist'
    }
  }

  if (command === 'serve') {
    // Development server
    config.base = '/'
  } else {
    // Production build for GitHub Pages
    config.base = '/deal-harvest-website/'
  }

  return config
})