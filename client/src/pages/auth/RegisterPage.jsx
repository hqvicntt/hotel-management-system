/**
 * RegisterPage.jsx - Trang đăng ký tài khoản mới
 * 
 * Tính năng:
 * 1. Form đăng ký với đầy đủ thông tin
 * 2. Validation cơ bản (email, password, phone)
 * 3. Gọi API register
 * 4. Tự động đăng nhập sau khi đăng ký thành công
 * 5. Chuyển hướng về trang chủ
 * 6. Hiển thị loading và thông báo lỗi
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'

// ============================================
// COMPONENT CHÍNH
// ============================================

const RegisterPage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  
  /**
   * Xử lý thay đổi input
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  /**
   * Validate form trước khi submit
   */
  const validateForm = () => {
    const { name, email, password, phone } = formData
    
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên')
      return false
    }
    
    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return false
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email.trim())) {
      setError('Email không hợp lệ. Vui lòng kiểm tra lại')
      return false
    }
    
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return false
    }
    
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return false
    }
    
    // Kiểm tra số điện thoại (10-11 số)
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(phone.trim())) {
      setError('Số điện thoại không hợp lệ (phải có 10-11 chữ số)')
      return false
    }
    
    return true
  }

  /**
   * Xử lý submit form
   * 1. Validate dữ liệu
   * 2. Gọi API register
   * 3. Tự động đăng nhập và lưu token
   * 4. Chuyển hướng
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate
    if (!validateForm()) return
    
    try {
      setLoading(true)
      setError('')
      
      // Gọi API register
      const response = await apiClient.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        // Không gửi role, mặc định là 'customer'
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
                          'Đăng ký thất bại. Vui lòng thử lại.'
      setError(errorMessage)
      console.error('Register error:', err)
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
            <p className="text-muted">Tạo tài khoản mới</p>
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
          
          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            
            {/* Full Name Input */}
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-semibold">
                <i className="bi bi-person me-1"></i>
                Họ và tên
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </div>
            
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
                  required
                />
              </div>
            </div>
            
            {/* Phone Input */}
            <div className="mb-3">
              <label htmlFor="phone" className="form-label fw-semibold">
                <i className="bi bi-phone me-1"></i>
                Số điện thoại
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-phone"></i>
                </span>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  placeholder="0987654321"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-text">
                Nhập 10-11 chữ số, không có khoảng trắng
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
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Đăng ký
                </>
              )}
            </button>
          </form>
          
          {/* Login Link */}
          <div className="text-center mt-4">
            <p className="mb-0">
              Đã có tài khoản?{' '}
              <Link to="/login" className="fw-bold text-decoration-none">
                Đăng nhập ngay
                <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage