/**
 * VITE CONFIGURATION - Cấu hình Vite cho dự án React
 * 
 * Các cấu hình chính:
 * 1. Đổi port từ 5173 -> 3000 (khớp với CLIENT_URL trong .env backend)
 * 2. Cấu hình proxy để tránh CORS khi development
 * 3. Tối ưu build
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Cấu hình server
  server: {
    port: 3000, // Đổi port mặc định từ 5173 sang 3000
    host: true, // Cho phép truy cập từ các thiết bị khác trong mạng LAN
    open: true, // Tự động mở trình duyệt khi chạy dev
    
    // Proxy: Chuyển tiếp các request API sang Backend để tránh CORS
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend server
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Cấu hình build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['bootstrap', 'bootstrap-icons']
        }
      }
    }
  },
  
  // Cấu hình resolve (import alias)
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@contexts': '/src/contexts',
      '@assets': '/src/assets'
    }
  }
})