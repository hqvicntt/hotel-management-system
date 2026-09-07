/**
 * ProtectedRoute.jsx - Component bảo vệ route yêu cầu đăng nhập
 * 
 * Nhiệm vụ:
 * 1. Kiểm tra token trong localStorage
 * 2. Nếu có token -> Cho phép truy cập trang
 * 3. Nếu không có token -> Chuyển hướng về trang login
 * 4. Nếu có token nhưng user data bị thiếu -> Tự động redirect về login
 * 
 * Cơ chế hoạt động:
 * - Đây là một Higher-Order Component (HOC) hoặc Wrapper Component
 * - Bọc các trang cần bảo vệ bên trong
 * - Sử dụng react-router-dom để điều hướng
 */
import { Navigate } from 'react-router-dom'

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {string} props.redirectTo - Đường dẫn chuyển hướng khi chưa đăng nhập (mặc định: '/login')
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  // ==========================================
  // 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
  // ==========================================
  
  // Lấy token từ localStorage
  const token = localStorage.getItem('token')
  
  // Lấy thông tin user (để kiểm tra data còn đầy đủ không)
  const userString = localStorage.getItem('user')
  let user = null
  
  try {
    if (userString) {
      user = JSON.parse(userString)
    }
  } catch (error) {
    console.error('❌ Failed to parse user data:', error)
  }

  // ==========================================
  // 2. KIỂM TRA ĐIỀU KIỆN ĐĂNG NHẬP
  // ==========================================
  
  /**
   * Điều kiện để xem là đã đăng nhập hợp lệ:
   * 1. Có token
   * 2. Có thông tin user và user có đủ các trường cần thiết (id, name, email)
   * 
   * Kiểm tra kỹ lưỡng để tránh lỗi khi dữ liệu bị corrupt
   */
  const isAuthenticated = token && user && user.id && user.name && user.email

  // ==========================================
  // 3. XỬ LÝ ĐIỀU HƯỚNG
  // ==========================================
  
  // Nếu chưa đăng nhập -> Chuyển hướng về trang login
  // Sử dụng Navigate với replace để không lưu vào history (ngăn quay lại)
  if (!isAuthenticated) {
    // Log để debug
    console.warn('🔒 Protected route: User not authenticated, redirecting to login')
    
    // Nếu có token nhưng không có user data, xóa token để tránh lỗi
    if (token && !user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    
    return <Navigate to={redirectTo} replace />
  }

  // ==========================================
  // 4. RENDER CHILDREN
  // ==========================================
  
  // Nếu đã đăng nhập -> Render component con (trang cần bảo vệ)
  return children
}

export default ProtectedRoute