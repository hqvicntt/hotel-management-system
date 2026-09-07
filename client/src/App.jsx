/**
 * App.jsx - Component gốc của ứng dụng
 * 
 * Nhiệm vụ:
 * 1. Thiết lập React Router cho toàn bộ ứng dụng
 * 2. Định nghĩa các routes và phân quyền
 * 3. Bọc các trang cần bảo vệ trong ProtectedRoute
 * 4. Điều hướng thông minh: nếu đã login, không cho vào login/register
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// ============================================
// 1. IMPORT PAGES
// ============================================

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Main Pages
import HomePage from './pages/HomePage'

// ============================================
// 2. IMPORT COMPONENTS
// ============================================

import ProtectedRoute from './components/common/ProtectedRoute'

// ============================================
// 3. HELPER: Auth Guard
// ============================================

/**
 * Kiểm tra xem user đã đăng nhập chưa
 * Dùng để chặn truy cập vào login/register khi đã login
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  const userString = localStorage.getItem('user')
  
  if (!token || !userString) return false
  
  try {
    const user = JSON.parse(userString)
    return !!(user.id && user.name && user.email)
  } catch {
    return false
  }
}

// ============================================
// 4. APP COMPONENT
// ============================================

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* ==========================================
              AUTH ROUTES - Công khai (Không cần login)
              Nhưng nếu đã login thì redirect về trang chủ
              ========================================== */}
          
          {/* Trang đăng nhập */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() 
                ? <Navigate to="/" replace /> 
                : <LoginPage />
            } 
          />
          
          {/* Trang đăng ký */}
          <Route 
            path="/register" 
            element={
              isAuthenticated() 
                ? <Navigate to="/" replace /> 
                : <RegisterPage />
            } 
          />
          
          {/* ==========================================
              MAIN ROUTES - Cần đăng nhập
              ========================================== */}
          
          {/* Trang chủ */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback 404 - Chuyển về login */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App