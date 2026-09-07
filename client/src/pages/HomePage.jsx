/**
 * HomePage.jsx - Trang chủ của ứng dụng
 * 
 * Tính năng:
 * 1. Hiển thị thông tin user từ localStorage
 * 2. Phân biệt giao diện theo vai trò (role)
 * 3. Nút đăng xuất với xác nhận
 * 4. Giao diện sạch sẽ, hiện đại với Bootstrap
 * 5. Responsive cho mọi thiết bị
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  
  // Khởi tạo thẳng dữ liệu từ localStorage ngay từ giây đầu tiên, né hoàn toàn useEffect
  const [user] = useState(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString) : null
    } catch (error) {
      console.error('❌ Error parsing user data from localStorage:', error)
      return null
    }
  })
  const navigate = useNavigate()

  // ==========================================
  // 2. EFFECTS
  // ==========================================
  
  /**
   * Cảm biến kiểm tra an ninh ngầm: Nếu không có user thì đá về login
   */
  useEffect(() => {
    if (!user) {
      console.warn('🔒 No user data found, redirecting to login...')
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  
  /**
   * Xử lý đăng xuất
   * 1. Xóa token và user khỏi localStorage
   * 2. Chuyển hướng về trang login
   * 3. Xóa localStorage trước để đảm bảo an toàn
   */
  const handleLogout = () => {
    // Xác nhận với user
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      // Xóa dữ liệu xác thực
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Chuyển hướng về login
      navigate('/login', { replace: true })
      
      console.log('👋 User logged out successfully')
    }
  }

  /**
   * Lấy tên hiển thị theo role
   */
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': { label: 'Quản trị viên', color: 'danger', icon: 'bi-shield-lock' },
      'staff': { label: 'Nhân viên', color: 'warning', icon: 'bi-person-badge' },
      'customer': { label: 'Khách hàng', color: 'primary', icon: 'bi-person' }
    }
    return roleMap[role] || { label: 'Người dùng', color: 'secondary', icon: 'bi-person' }
  }

  /**
   * Lấy thông báo chào theo thời gian trong ngày
   */
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng ☀️'
    if (hour < 18) return 'Chào buổi chiều 🌤️'
    return 'Chào buổi tối 🌙'
  }

  // ==========================================
  // 4. RENDER
  // ==========================================

  // Nếu không có user (phòng trường hợp lỗi)
  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.
        </div>
      </div>
    )
  }

  // Lấy thông tin role
  const roleInfo = getRoleDisplay(user.role || 'customer')
  const greeting = getGreeting()

  return (
    <div className="container-fluid min-vh-100 bg-light">
      {/* ==========================================
          HEADER / NAVBAR
          ========================================== */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <i className="bi bi-building me-2"></i>
            Hotel Management
          </a>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 d-none d-md-inline">
              <i className={`bi ${roleInfo.icon} me-1`}></i>
              {user.role === 'admin' ? 'Admin' : ''}
            </span>
            <button 
              className="btn btn-outline-light btn-sm" 
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* ==========================================
          MAIN CONTENT
          ========================================== */}
      <div className="container py-4">
        {/* Welcome Card */}
        <div className="card shadow-sm border-0 fade-in">
          <div className="card-body p-4 p-md-5">
            <div className="row align-items-center">
              <div className="col-md-8">
                {/* Greeting */}
                <h5 className="text-muted mb-2">{greeting}</h5>
                
                {/* User Info */}
                <h1 className="display-5 fw-bold mb-3">
                  <span className="text-primary">{user.name}</span>
                </h1>
                
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {/* Role Badge */}
                  <span className={`badge bg-${roleInfo.color} fs-6 px-3 py-2`}>
                    <i className={`bi ${roleInfo.icon} me-1`}></i>
                    {roleInfo.label}
                  </span>
                  
                  {/* Email */}
                  <span className="badge bg-secondary bg-opacity-10 text-dark fs-6 px-3 py-2">
                    <i className="bi bi-envelope me-1"></i>
                    {user.email}
                  </span>
                  
                  {/* Phone */}
                  {user.phone && (
                    <span className="badge bg-secondary bg-opacity-10 text-dark fs-6 px-3 py-2">
                      <i className="bi bi-phone me-1"></i>
                      {user.phone}
                    </span>
                  )}
                </div>
                
                {/* Welcome Message */}
                <p className="text-muted fs-5 mb-0">
                  Chào mừng bạn đến với hệ thống quản lý khách sạn!
                </p>
              </div>
              
              <div className="col-md-4 text-center mt-4 mt-md-0">
                <div className="bg-primary bg-opacity-10 rounded-circle p-4 d-inline-block">
                  <i className="bi bi-person-circle text-primary" style={{ fontSize: '4rem' }}></i>
                </div>
                <p className="text-muted small mt-2">
                  ID: {user.id?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            QUICK STATS / FEATURES
            ========================================== */}
        <div className="row mt-4 g-3">
          {/* Feature 1: Manage Rooms */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i className="bi bi-door-open text-primary fs-1"></i>
                </div>
                <h5 className="card-title fw-bold">Quản lý phòng</h5>
                <p className="card-text text-muted small">
                  Xem danh sách, thêm mới, cập nhật trạng thái phòng
                </p>
              </div>
            </div>
          </div>
          
          {/* Feature 2: Manage Bookings */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i className="bi bi-calendar-check text-success fs-1"></i>
                </div>
                <h5 className="card-title fw-bold">Đặt phòng</h5>
                <p className="card-text text-muted small">
                  Xem lịch sử, tạo đơn đặt phòng mới
                </p>
              </div>
            </div>
          </div>
          
          {/* Feature 3: Dashboard */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i className="bi bi-graph-up text-info fs-1"></i>
                </div>
                <h5 className="card-title fw-bold">Thống kê</h5>
                <p className="card-text text-muted small">
                  Doanh thu, số lượng phòng đang thuê
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            USER INFO CARD (Detailed)
            ========================================== */}
        <div className="card shadow-sm border-0 mt-4">
          <div className="card-header bg-white border-0 pt-3">
            <h5 className="card-title fw-bold mb-0">
              <i className="bi bi-info-circle me-2 text-primary"></i>
              Thông tin chi tiết
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-2">
                  <span className="text-muted">Họ và tên:</span>
                  <span className="ms-2 fw-semibold">{user.name}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted">Email:</span>
                  <span className="ms-2 fw-semibold">{user.email}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <span className="text-muted">Số điện thoại:</span>
                  <span className="ms-2 fw-semibold">{user.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted">Vai trò:</span>
                  <span className={`ms-2 fw-semibold text-${roleInfo.color}`}>
                    <i className={`bi ${roleInfo.icon} me-1`}></i>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer bg-white border-0 pb-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage