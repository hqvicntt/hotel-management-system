/**
 * HomePage.jsx - Trang chủ của ứng dụng
 * 
 * Tính năng:
 * 1. Hiển thị thông tin user từ localStorage
 * 2. Hiển thị danh sách phòng từ Backend
 * 3. Filter phòng theo loại và giá
 * 4. Phân trang
 * 5. Nút đăng xuất
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRooms } from '@services/roomService'
import RoomCard from '@components/room/RoomCard'

// ============================================
// 1. COMPONENT CHÍNH
// ============================================

const HomePage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT (Tối ưu hóa Lazy Initialization)
  // ==========================================
  
  // Nạp thẳng User từ localStorage từ giây đầu tiên để né lỗi useEffect
  const [user] = useState(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString) : null
    } catch (error) {
      console.error('❌ Error parsing user data:', error)
      return null
    }
  })

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    status: 'Available',
    sort: 'price',
    limit: 12,
    page: 1
  })
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1
  })

  const navigate = useNavigate()

  // ==========================================
  // 2. EFFECTS (An ninh & Tải dữ liệu phòng)
  // ==========================================
  
  /**
   * Cảm biến bảo mật: Chưa có user thì đá văng ra trang Login
   */
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  /**
   * Cảm biến tải danh sách phòng: Tự động chạy lại mỗi khi filters thay đổi
   */
  useEffect(() => {
    // Chỉ gọi API khi tài khoản người dùng hợp lệ
    if (user) {
      const fetchRooms = async () => {
        try {
          setLoading(true)
          setError('')
          const result = await getAllRooms(filters)
          
          if (result.success) {
            setRooms(result.data)
            setPagination({
              total: result.total,
              totalPages: result.totalPages,
              currentPage: result.currentPage
            })
          } else {
            setError(result.message || 'Không thể tải danh sách phòng')
          }
        } catch (err) {
          console.error('❌ Fetch rooms error:', err)
          setError('Lỗi khi tải danh sách phòng. Vui lòng thử lại.')
        } finally {
          setLoading(false)
        }
      }

      fetchRooms()
    }
  }, [filters, user])

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset về trang 1 khi lọc thay đổi
    }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBookRoom = (room) => {
    alert(`Bạn đã chọn phòng ${room.roomNumber} - ${room.type}`)
    console.log('Booking room:', room)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng ☀️'
    if (hour < 18) return 'Chào buổi chiều 🌤️'
    return 'Chào buổi tối 🌙'
  }

  // ==========================================
  // 4. RENDER PRE-CHECKS
  // ==========================================
  
  // Loading ban đầu khi chưa có phòng nào
  if (loading && rooms.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải danh sách phòng...</p>
        </div>
      </div>
    )
  }

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

  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': { label: 'Quản trị viên', color: 'danger', icon: 'bi-shield-lock' },
      'staff': { label: 'Nhân viên', color: 'warning', icon: 'bi-person-badge' },
      'customer': { label: 'Khách hàng', color: 'primary', icon: 'bi-person' }
    }
    return roleMap[role] || { label: 'Người dùng', color: 'secondary', icon: 'bi-person' }
  }

  const roleInfo = getRoleDisplay(user.role || 'customer')
  const greeting = getGreeting()

  return (
    <div className="container-fluid min-vh-100 bg-light">
      
      {/* ==========================================
          HEADER / NAVBAR
          ========================================== */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <i className="bi bi-building me-2"></i>
            Hotel Management
          </a>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 d-none d-md-inline">
              <i className={`bi ${roleInfo.icon} me-1`}></i>
              {greeting}, {user.name}
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
        
        {/* Welcome Section */}
        <div className="card shadow-sm border-0 mb-4 bg-gradient-primary text-white">
          <div className="card-body p-4 p-md-5">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h1 className="display-5 fw-bold mb-2">
                  <span className="text-white">{greeting}</span>
                </h1>
                <p className="fs-5 mb-1">
                  <span className="fw-bold">{user.name}</span>
                  <span className="badge bg-${roleInfo.color} ms-2 px-3 py-1 text-white">
                    <i className={`bi ${roleInfo.icon} me-1`}></i>
                    {roleInfo.label}
                  </span>
                </p>
                <p className="text-white mb-0">
                  <i className="bi bi-phone me-1"></i>
                  {user.phone || 'Chưa cập nhật SĐT'}
                </p>
              </div>
              <div className="col-md-4 text-center mt-3 mt-md-0">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                  <i className="bi bi-person-circle text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            FILTERS
            ========================================== */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-funnel me-1"></i>
                  Loại phòng
                </label>
                <select 
                  name="type" 
                  className="form-select"
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">Tất cả</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-sort-up me-1"></i>
                  Sắp xếp theo
                </label>
                <select 
                  name="sort" 
                  className="form-select"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="price">Giá thấp - cao</option>
                  <option value="-price">Giá cao - thấp</option>
                  <option value="createdAt">Mới nhất</option>
                </select>
              </div>
              
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-currency-dollar me-1"></i>
                  Khoảng giá (VNĐ)
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Từ"
                      name="minPrice"
                      value={filters.minPrice || ''}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Đến"
                      name="maxPrice"
                      value={filters.maxPrice || ''}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setFilters({
                      type: '',
                      status: 'Available',
                      sort: 'price',
                      limit: 12,
                      page: 1
                    })
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ROOM LIST
            ========================================== */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        {/* Room Count */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <i className="bi bi-door-open me-2 text-primary"></i>
            {pagination.total > 0 ? (
              <>Tìm thấy <span className="fw-bold text-primary">{pagination.total}</span> phòng</>
            ) : (
              'Không tìm thấy phòng nào'
            )}
          </h5>
          {rooms.length > 0 && (
            <span className="text-muted small">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </span>
          )}
        </div>

        {/* Room Cards Grid */}
        {rooms.length > 0 ? (
          <div className="row g-4">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onBook={handleBookRoom}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-door-closed display-1 text-muted"></i>
            <p className="text-muted mt-3 fs-5">
              {loading ? 'Đang tải...' : 'Không có phòng nào phù hợp với tiêu chí lọc'}
            </p>
          </div>
        )}

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {pagination.totalPages > 1 && (
          <nav className="mt-4 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${pagination.currentPage <= 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {[...Array(pagination.totalPages).keys()].map((_, index) => {
                const page = index + 1
                // Chỉ hiển thị 5 trang xung quanh trang hiện tại
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.currentPage) <= 2
                ) {
                  return (
                    <li 
                      key={page} 
                      className={`page-item ${page === pagination.currentPage ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                }
                // Hiển thị dấu ... ở giữa
                if (page === pagination.currentPage - 3 || page === pagination.currentPage + 3) {
                  return (
                    <li key={page} className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )
                }
                return null
              })}
              
              <li className={`page-item ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}

export default HomePage