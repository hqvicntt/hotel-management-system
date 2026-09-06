/**
 * LoginPage.jsx - Trang đăng nhập
 * 
 * Tính năng:
 * 1. Form đăng nhập với email và password
 * 2. Validation cơ bản
 * 3. Gọi API login
 * 4. Lưu token và user vào localStorage
 * 5. Chuyển hướng về trang chủ
 * 6. Hiển thị loading và thông báo lỗi
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'

// ============================================
// COMPONENT CHÍNH
// ============================================

const LoginPage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  
  /**
   * Xử lý thay đổi input
   * Cập nhật state khi người dùng nhập liệu
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (error) setError('')
  }

  /**
   * Xử lý submit form
   * 1. Validate dữ liệu
   * 2. Gọi API login
   * 3. Lưu token và thông tin user
   * 4. Chuyển hướng
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate cơ bản
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      // Gọi API login
      const response = await apiClient.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      })
      
      // Kiểm tra response
      if (response.data.success) {
        const { token, user } = response.data
        
        // Lưu token và user vào localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Chuyển hướng về trang chủ
        navigate('/', { replace: true })
      }
      
    } catch (err) {
      // Xử lý lỗi từ API
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Đăng nhập thất bại. Vui lòng thử lại.'
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // 3. RENDER
  // ==========================================
  
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="card-body">
          
          {/* Logo / Header */}
          <div className="text-center mb-4">
            <i className="bi bi-building fs-1 text-primary"></i>
            <h3 className="mt-2 fw-bold">Hotel Management</h3>
            <p className="text-muted">Đăng nhập để tiếp tục</p>
          </div>
          
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}
          
          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            
            {/* Email Input */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">
                <i className="bi bi-envelope me-1"></i>
                Email
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">
                <i className="bi bi-lock me-1"></i>
                Mật khẩu
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-text">
                Mật khẩu phải có ít nhất 6 ký tự
              </div>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Đăng nhập
                </>
              )}
            </button>
          </form>
          
          {/* Register Link */}
          <div className="text-center mt-4">
            <p className="mb-0">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="fw-bold text-decoration-none">
                Đăng ký ngay
                <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </p>
          </div>
          
          {/* Demo Accounts */}
          <div className="mt-3 p-3 bg-light rounded">
            <p className="text-center text-muted small mb-2">
              <i className="bi bi-info-circle me-1"></i>
              Tài khoản demo:
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <span className="badge bg-primary">Customer: customer@demo.com</span>
              <span className="badge bg-success">Admin: admin@demo.com</span>
            </div>
            <p className="text-center text-muted small mt-1 mb-0">
              Mật khẩu: 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage