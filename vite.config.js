import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/geotagjayal/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        bharatnet: resolve(__dirname, 'bharatnet/index.html'),
        pm_visit: resolve(__dirname, 'pm_visit/index.html')
      }
    }
  },
  server: {
    port: 8000,
    strictPort: true,
    host: 'localhost'
  }
})
