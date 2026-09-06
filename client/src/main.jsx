/**
 * main.jsx - Điểm vào chính của ứng dụng React
 * 
 * Nhiệm vụ:
 * 1. Import Bootstrap và các styles toàn cục
 * 2. Render component App vào DOM
 * 3. Bọc ứng dụng trong StrictMode để phát hiện lỗi tiềm ẩn
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ============================================
// 1. IMPORT BOOTSTRAP VÀ CUSTOM STYLES
// ============================================

// Bootstrap 5 CSS (Framework UI chính)
import 'bootstrap/dist/css/bootstrap.min.css'

// Bootstrap Icons (Bộ icon đẹp)
import 'bootstrap-icons/font/bootstrap-icons.css'

// Custom styles (Ghi đè và mở rộng Bootstrap)
import './index.css'

// ============================================
// 2. RENDER ỨNG DỤNG
// ============================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)