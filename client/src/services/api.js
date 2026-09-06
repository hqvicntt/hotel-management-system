/**
 * api.js - Cấu hình Axios cho toàn bộ ứng dụng
 * 
 * Nhiệm vụ:
 * 1. Tạo instance Axios với baseURL và headers mặc định
 * 2. Tự động đính kèm token vào mọi request
 * 3. Xử lý lỗi tập trung
 * 4. Tự động refresh token khi hết hạn (sẽ thêm sau)
 */

import axios from 'axios'

// ============================================
// 1. TẠO AXIOS INSTANCE
// ============================================

/**
 * API Client - Instance chính để gọi Backend
 * - baseURL: Sử dụng proxy của Vite (http://localhost:5000)
 * - timeout: 30 giây
 */
const apiClient = axios.create({
  baseURL: '/api', // Proxy sang backend port 5000
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ============================================
// 2. INTERCEPTOR - REQUEST
// ============================================

/**
 * Request Interceptor: Tự động đính kèm token vào header
 * Mỗi khi có request được gửi đi, interceptor này sẽ chạy
 * để lấy token từ localStorage và gắn vào Authorization header
 */
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token')
    
    // Nếu có token, đính kèm vào header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log request (chỉ khi development)
    if (import.meta.env.DEV) {
      console.log(`📤 [API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '')
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// ============================================
// 3. INTERCEPTOR - RESPONSE
// ============================================

/**
 * Response Interceptor: Xử lý lỗi tập trung
 * Khi nhận response từ server, interceptor này sẽ kiểm tra
 * nếu có lỗi 401 (Unauthorized) thì tự động logout
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response (chỉ khi development)
    if (import.meta.env.DEV) {
      console.log(`📥 [API Response] ${response.config.url}`, response.data)
    }
    return response
  },
  (error) => {
    // Xử lý lỗi 401 - Token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('⚠️ Token expired or invalid - Logging out...')
      
      // Xóa token và thông tin user khỏi localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Chuyển hướng về trang login
      window.location.href = '/login'
    }
    
    // Log lỗi chi tiết
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    })
    
    return Promise.reject(error)
  }
)

// ============================================
// 4. EXPORT CÁC HÀM TIỆN ÍCH
// ============================================

/**
 * Hàm setAuthToken: Cập nhật token mới
 * @param {string} token - Token JWT mới
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

/**
 * Hàm getAuthToken: Lấy token hiện tại
 * @returns {string|null} - Token hoặc null
 */
export const getAuthToken = () => {
  return localStorage.getItem('token')
}

/**
 * Hàm removeAuthToken: Xóa token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export default apiClient