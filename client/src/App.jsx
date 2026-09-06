/**
 * App.jsx - Component gốc của ứng dụng
 * 
 * Nhiệm vụ:
 * 1. Thiết lập React Router cho toàn bộ ứng dụng
 * 2. Định nghĩa các routes và phân quyền
 * 3. Bọc ứng dụng trong AuthProvider để chia sẻ trạng thái đăng nhập
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// ============================================
// 1. IMPORT PAGES
// ============================================

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Main Pages (Sẽ tạo sau)
// import HomePage from './pages/HomePage'
// import DashboardPage from './pages/DashboardPage'

// ============================================
// 2. IMPORT COMPONENTS
// ============================================

// import ProtectedRoute from './components/common/ProtectedRoute'
// import Layout from './components/common/Layout'

// ============================================
// 3. APP COMPONENT
// ============================================

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* ==========================================
              AUTH ROUTES - Công khai (Không cần login)
              ========================================== */}
          
          {/* Trang đăng nhập */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Trang đăng ký */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* ==========================================
              MAIN ROUTES - Sẽ thêm sau
              ========================================== */}
          
          {/* Trang chủ - Tạm thời redirect về login */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
          />
          
          {/* Fallback 404 - Chuyển về login */}
          <Route 
            path="*" 
            element={<Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App