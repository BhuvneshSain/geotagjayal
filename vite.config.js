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
        bharatnet: resolve(__dirname, 'bharatnet/index.html'),
        bharatnet_admin: resolve(__dirname, 'bharatnet/admin/index.html')
      }
    }
  },
  server: {
    port: 8000,
    strictPort: true,
    host: 'localhost'
  }
})
