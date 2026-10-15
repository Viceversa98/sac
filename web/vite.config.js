import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Membuka akses dari jaringan lokal (IP LAN/WiFi), tunnel, dll
    allowedHosts: true, // Mengizinkan semua hostname/domain (ngrok, locallhost, IP, dll)
    cors: true, // Mengizinkan Cross-Origin Resource Sharing
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
