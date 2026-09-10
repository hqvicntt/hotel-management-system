/**
 * HomePage.jsx - Trang chủ của ứng dụng
 * 
 * Tính năng:
 * 1. Hiển thị thông tin user từ localStorage
 * 2. Hiển thị danh sách phòng từ Backend
 * 3. Filter phòng theo loại và giá
 * 4. Phân trang
 * 5. Đặt phòng qua Modal với validation
 * 6. Nút đăng xuất
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAllRooms } from '@services/roomService'
import { createBooking } from '@services/bookingService'
import RoomCard from '@components/room/RoomCard'

// ============================================
// 1. COMPONENT CHÍNH
// ============================================

const HomePage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  
  // User state
  const [user] = useState(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString) : null
    } catch {
      return null
    }
  })

  // Room list states
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

  // ==========================================
  // 2. BOOKING MODAL STATES (THÊM MỚI)
  // ==========================================
  
  const [showModal, setShowModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    specialRequests: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const navigate = useNavigate()

  // ==========================================
  // 3. EFFECTS & DATA FETCHING (Chuẩn hóa cô lập React 19 sạch 100%)
  // ==========================================
  
  // Cảm biến an ninh: Chưa login đá ra trang Login
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  // Cảm biến tải phòng: Tự động gọi lại mỗi khi filters thay đổi
  useEffect(() => {
    if (user) {
      const executeFetchRooms = async () => {
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

      executeFetchRooms() // Kích hoạt chạy cô lập ngầm dưới bo mạch mạng
    }
  }, [filters, user]) // Chạy lại tự động khi bộ lọc thay đổi


  // ==========================================
  // 5. HANDLERS
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
      page: 1
    }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ==========================================
  // 6. BOOKING HANDLERS
  // ==========================================
  
  /**
   * Mở Modal đặt phòng
   * Khi click "Đặt phòng ngay", bốc thông tin phòng và hiển thị form
   */
  const handleOpenBookingModal = (room) => {
    setSelectedRoom(room)
    setBookingForm({
      checkInDate: '',
      checkOutDate: '',
      guestCount: 1,
      specialRequests: ''
    })
    setBookingError('')
    setShowModal(true)
  }

  /**
   * Đóng Modal
   */
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedRoom(null)
    setBookingForm({
      checkInDate: '',
      checkOutDate: '',
      guestCount: 1,
      specialRequests: ''
    })
    setBookingError('')
    setBookingLoading(false)
  }

  /**
   * Xử lý thay đổi input trong form đặt phòng
   */
  const handleBookingInputChange = (e) => {
    const { name, value } = e.target
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }))
    if (bookingError) setBookingError('')
  }

  /**
   * Xác nhận đặt phòng
   * Gọi API createBooking và xử lý kết quả
   */
  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    
    // 1. Validate dữ liệu
    if (!bookingForm.checkInDate || !bookingForm.checkOutDate) {
      setBookingError('Vui lòng chọn ngày nhận và ngày trả phòng')
      return
    }

    const checkIn = new Date(bookingForm.checkInDate)
    const checkOut = new Date(bookingForm.checkOutDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (checkIn < now) {
      setBookingError('Ngày nhận phòng không được ở quá khứ')
      return
    }

    if (checkIn >= checkOut) {
      setBookingError('Ngày trả phòng phải sau ngày nhận phòng')
      return
    }

    if (bookingForm.guestCount < 1) {
      setBookingError('Số lượng khách phải ít nhất là 1')
      return
    }

    if (selectedRoom && bookingForm.guestCount > selectedRoom.maxOccupants) {
      setBookingError(`Số lượng khách (${bookingForm.guestCount}) vượt quá sức chứa tối đa (${selectedRoom.maxOccupants})`)
      return
    }

    try {
      setBookingLoading(true)
      setBookingError('')

      // 2. Gọi API tạo booking
      const result = await createBooking({
        roomId: selectedRoom._id,
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        guestCount: bookingForm.guestCount,
        specialRequests: bookingForm.specialRequests || ''
      })

      // 3. Xử lý thành công
      if (result.success) {
        // Hiển thị thông báo
        alert(`✅ Đặt phòng thành công!\nMã đơn: ${result.data.bookingCode}\nPhòng: ${selectedRoom.roomNumber}\nTổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.data.totalAmount)}`)

        // Đóng modal
        handleCloseModal()

        // Cú hích UI lập tức: Đổi trạng thái phòng vừa đặt sang 'Booked' ngay trên giao diện để nút bấm đổi màu trong 0 mili-giây
        setRooms(prevRooms => 
          prevRooms.map(r => r._id === selectedRoom._id ? { ...r, status: 'Booked' } : r)
        );
      } else {
        setBookingError(result.message || 'Đặt phòng thất bại')
      }
    } catch (err) {
      console.error('❌ Booking error:', err)
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       'Lỗi khi đặt phòng. Vui lòng thử lại.'
      setBookingError(errorMsg)
    } finally {
      setBookingLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng ☀️'
    if (hour < 18) return 'Chào buổi chiều 🌤️'
    return 'Chào buổi tối 🌙'
  }

  // ==========================================
  // 7. RENDER PRE-CHECKS
  // ==========================================
  
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

  // ==========================================
  // 8. RENDER
  // ==========================================
  
  return (
    <div className="container-fluid min-vh-100 bg-light">
      
      {/* ==========================================
          HEADER / NAVBAR
          ========================================== */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-building me-2"></i>
            Hotel Management
          </Link>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white d-none d-md-inline">
              <i className={`bi ${roleInfo.icon} me-1`}></i>
              {greeting}, {user.name}
            </span>

            <Link to="/my-bookings" className="btn btn-outline-light btn-sm">
              <i className="bi bi-clock-history me-1"></i>
              Lịch sử đặt
            </Link>

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
                  <span className={`badge bg-${roleInfo.color} ms-2 px-3 py-1`}>
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
                <div className="bg-opacity-20 rounded-circle p-3 d-inline-block">
                  <i className="bi bi-person-circle" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="row mb-4 g-3">
          <div className="col-md-4">
            <Link to="/my-bookings" className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100 hover-shadow transition-all">
                <div className="card-body text-center p-4">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-clock-history text-info fs-1"></i>
                  </div>
                  <h5 className="card-title fw-bold text-dark">Lịch sử đặt phòng</h5>
                  <p className="card-text text-muted small mb-0">
                    Xem lại các đơn đặt phòng của bạn
                  </p>
                </div>
              </div>
            </Link>
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

        {rooms.length > 0 ? (
          <div className="row g-4">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onBook={handleOpenBookingModal} // Sửa: Gọi hàm mở Modal thay vì alert
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

        {/* Pagination */}
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

      {/* ==========================================
          BOOKING MODAL
          ========================================== */}
      {selectedRoom && (
        <div 
          className={`modal fade ${showModal ? 'show d-block' : ''}`} 
          tabIndex="-1" 
          style={{ 
            display: showModal ? 'block' : 'none',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              
              {/* Modal Header */}
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Đặt phòng {selectedRoom.roomNumber}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleCloseModal}
                ></button>
              </div>
              
              {/* Modal Body */}
              <div className="modal-body">
                {/* Room Info Summary */}
                <div className="bg-light p-3 rounded mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <div><strong>Phòng:</strong> {selectedRoom.roomNumber}</div>
                      <div><strong>Loại:</strong> {selectedRoom.type}</div>
                      <div><strong>Sức chứa:</strong> {selectedRoom.maxOccupants} người</div>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <div><strong>Giá:</strong></div>
                      <div className="text-primary fw-bold fs-4">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0
                        }).format(selectedRoom.pricePerNight)}
                        <span className="text-muted fs-6"> /đêm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleConfirmBooking}>
                  {bookingError && (
                    <div className="alert alert-danger alert-dismissible fade show">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {bookingError}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setBookingError('')}
                      ></button>
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Check-in Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-calendar-check text-success me-1"></i>
                        Ngày nhận phòng *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="checkInDate"
                        value={bookingForm.checkInDate}
                        onChange={handleBookingInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* Check-out Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-calendar-x text-danger me-1"></i>
                        Ngày trả phòng *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="checkOutDate"
                        value={bookingForm.checkOutDate}
                        onChange={handleBookingInputChange}
                        min={bookingForm.checkInDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* Guest Count */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-people me-1"></i>
                        Số lượng khách *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="guestCount"
                        value={bookingForm.guestCount}
                        onChange={handleBookingInputChange}
                        min={1}
                        max={selectedRoom.maxOccupants}
                        required
                      />
                      <div className="form-text">
                        Tối đa {selectedRoom.maxOccupants} người
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-chat me-1"></i>
                        Yêu cầu đặc biệt
                      </label>
                      <textarea
                        className="form-control"
                        name="specialRequests"
                        value={bookingForm.specialRequests}
                        onChange={handleBookingInputChange}
                        rows="3"
                        placeholder="Ví dụ: Cần giường phụ, phòng không hút thuốc, ..."
                        maxLength={500}
                      ></textarea>
                      <div className="form-text text-end">
                        {bookingForm.specialRequests.length}/500
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Modal Footer */}
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={bookingLoading}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Hủy
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i>
                      Xác nhận đặt phòng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage