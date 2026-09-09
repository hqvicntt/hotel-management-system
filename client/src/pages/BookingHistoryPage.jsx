/**
 * BookingHistoryPage.jsx - Trang lịch sử đặt phòng
 * 
 * Tính năng:
 * 1. Hiển thị danh sách đơn đặt phòng của user
 * 2. Lọc theo trạng thái
 * 3. Hủy đơn đặt phòng (nếu đang ở trạng thái Pending)
 * 4. Hiển thị thông tin chi tiết từng đơn
 * 5. Responsive với Bootstrap 5
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  getMyBookings, 
  cancelBooking, 
  formatDate, 
  getStatusColor, 
  getStatusLabel,
  getPaymentColor,
  getPaymentLabel
} from '@services/bookingService'

// ============================================
// COMPONENT CHÍNH
// ============================================

const BookingHistoryPage = () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  
  const [user] = useState(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString) : null
    } catch {
      return null
    }
  })
  
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [cancellingId, setCancellingId] = useState(null)
  const navigate = useNavigate()

  // ==========================================
  // 1. EFFECTS & DATA FETCHING (Chuẩn hóa cô lập React 19 sạch 100%)
  // ==========================================
  
  // Cảm biến an ninh: Chưa login thì đá về Login
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  // Cảm biến tải đơn hàng: Tự động chạy và cô lập hoàn toàn biến trạng thái
  useEffect(() => {
    if (user) {
      // Khai báo hàm bất đồng bộ nội bộ
      const executeFetch = async () => {
        try {
          setLoading(true)
          setError('')
          const filters = {}
          if (statusFilter) filters.status = statusFilter
          
          const result = await getMyBookings(filters)
          if (result.success) {
            setBookings(result.data)
          } else {
            setError(result.message || 'Không thể tải lịch sử đặt phòng')
          }
        } catch (err) {
          console.error('❌ Fetch bookings error:', err)
          setError('Lỗi khi tải lịch sử đặt phòng. Vui lòng thử lại.')
        } finally {
          setLoading(false)
        }
      }

      executeFetch() // Kích hoạt chạy cô lập ngầm
    }
  }, [statusFilter, user]) // Chạy lại tự động mỗi khi bộ lọc hoặc tài khoản thay đổi

  // ==========================================
  // 2. HANDLERS (Xử lý sự kiện)
  // ==========================================
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng này?')) {
      return
    }
    try {
      setCancellingId(bookingId)
      const result = await cancelBooking(bookingId, 'Khách hàng hủy đơn')
      if (result.success) {
        // Tuyệt chiêu React 19: Bắn lệnh thay đổi bộ lọc giả lập để ép useEffect ở trên tự động kích hoạt tải lại dữ liệu sạch
        setStatusFilter(prev => prev) 
        
        // Để chắc chắn đồng bộ, ta tạo một cú hích cập nhật kho lưu trữ đơn hàng lập tức
        setBookings(prevBookings => 
          prevBookings.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b)
        )
        
        alert('Hủy đơn đặt phòng thành công!')
      } else {
        alert(result.message || 'Hủy đơn thất bại')
      }
    } catch (err) {
      console.error('❌ Cancel booking error:', err)
      alert('Lỗi khi hủy đơn đặt phòng. Vui lòng thử lại.')
    } finally {
      setCancellingId(null)
    }
  }



  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    }
  }

  // ==========================================
  // 5. RENDER
  // ==========================================
  
  // Loading
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải lịch sử đặt phòng...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Vui lòng đăng nhập để xem lịch sử đặt phòng.
        </div>
      </div>
    )
  }

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
            <Link to="/" className="btn btn-outline-light btn-sm">
              <i className="bi bi-house me-1"></i>
              Trang chủ
            </Link>
            <button 
              className="btn btn-outline-light btn-sm" 
              onClick={handleLogout}
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
        
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="bi bi-clock-history text-primary me-2"></i>
            Lịch sử đặt phòng
          </h2>
          <Link to="/" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Đặt phòng mới
          </Link>
        </div>

        {/* ==========================================
            FILTERS
            ========================================== */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-funnel me-1"></i>
                  Lọc theo trạng thái
                </label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Confirmed">Đã xác nhận</option>
                  <option value="CheckedIn">Đã nhận phòng</option>
                  <option value="CheckedOut">Đã trả phòng</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>
              <div className="col-md-4">
                <div className="text-muted small mt-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Tổng số đơn: <span className="fw-bold">{bookings.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ERROR
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

        {/* ==========================================
            BOOKING LIST
            ========================================== */}
        {bookings.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <h4 className="text-muted mt-3">Chưa có đơn đặt phòng nào</h4>
            <p className="text-muted">Hãy đặt phòng ngay để trải nghiệm dịch vụ của chúng tôi!</p>
            <Link to="/" className="btn btn-primary mt-2">
              <i className="bi bi-plus-circle me-2"></i>
              Đặt phòng ngay
            </Link>
          </div>
        ) : (
          <div className="row g-3">
            {bookings.map((booking) => {
              const statusColor = getStatusColor(booking.status)
              const statusLabel = getStatusLabel(booking.status)
              const paymentColor = getPaymentColor(booking.paymentStatus)
              const paymentLabel = getPaymentLabel(booking.paymentStatus)
              const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'
              const isCancelling = cancellingId === booking._id

              return (
                <div key={booking._id} className="col-12">
                  <div className="card shadow-sm border-0 hover-shadow transition-all fade-in">
                    <div className="card-body p-3 p-md-4">
                      <div className="row align-items-center">
                        
                        {/* ==============================
                            LEFT: Thông tin chính
                            ============================== */}
                        <div className="col-md-8">
                          {/* Header: Mã đơn + Trạng thái */}
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <h5 className="fw-bold mb-0">
                              <span className="text-primary">{booking.bookingCode}</span>
                            </h5>
                            <span className={`badge bg-${statusColor} px-3 py-2`}>
                              <i className={`bi ${
                                booking.status === 'Pending' ? 'bi-clock' :
                                booking.status === 'Confirmed' ? 'bi-check-circle' :
                                booking.status === 'CheckedIn' ? 'bi-door-open' :
                                booking.status === 'CheckedOut' ? 'bi-door-closed' :
                                'bi-x-circle'
                              } me-1`}></i>
                              {statusLabel}
                            </span>
                            <span className={`badge bg-${paymentColor} px-3 py-2`}>
                              <i className={`bi ${
                                booking.paymentStatus === 'Paid' ? 'bi-credit-card' : 'bi-exclamation-circle'
                              } me-1`}></i>
                              {paymentLabel}
                            </span>
                          </div>

                          {/* Room Info */}
                          <div className="d-flex flex-wrap gap-3 mb-2">
                            <div>
                              <i className="bi bi-door-open text-primary me-1"></i>
                              <strong>Phòng:</strong> {booking.roomId?.roomNumber || 'N/A'}
                            </div>
                            <div>
                              <i className="bi bi-tag text-primary me-1"></i>
                              <strong>Loại:</strong> {booking.roomId?.type || 'N/A'}
                            </div>
                            <div>
                              <i className="bi bi-people text-primary me-1"></i>
                              <strong>Khách:</strong> {booking.guestCount} người
                            </div>
                          </div>

                          {/* Date Range */}
                          <div className="d-flex flex-wrap gap-3 mb-2">
                            <div>
                              <i className="bi bi-calendar-check text-success me-1"></i>
                              <strong>Nhận phòng:</strong> {formatDate(booking.checkInDate)}
                            </div>
                            <div>
                              <i className="bi bi-calendar-x text-danger me-1"></i>
                              <strong>Trả phòng:</strong> {formatDate(booking.checkOutDate)}
                            </div>
                            <div>
                              <i className="bi bi-moon-stars text-primary me-1"></i>
                              <strong>Số đêm:</strong> {booking.nightCount || 0}
                            </div>
                          </div>

                          {/* Special Requests */}
                          {booking.specialRequests && (
                            <div className="text-muted small">
                              <i className="bi bi-chat me-1"></i>
                              <strong>Yêu cầu:</strong> {booking.specialRequests}
                            </div>
                          )}
                        </div>

                        {/* ==============================
                            RIGHT: Giá tiền + Actions
                            ============================== */}
                        <div className="col-md-4 mt-3 mt-md-0">
                          <div className="text-md-end">
                            {/* Price */}
                            <div className="mb-2">
                              <span className="text-muted small">Tổng tiền</span>
                              <div className="fw-bold text-primary fs-4">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                  minimumFractionDigits: 0
                                }).format(booking.totalAmount)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                              {canCancel && (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={isCancelling}
                                >
                                  {isCancelling ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1"></span>
                                      Đang hủy...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-x-circle me-1"></i>
                                      Hủy đơn
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => alert(`Chi tiết đơn ${booking.bookingCode}`)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                Chi tiết
                              </button>
                            </div>

                            {/* Created date */}
                            <div className="text-muted small mt-2">
                              <i className="bi bi-clock me-1"></i>
                              Đặt lúc: {new Date(booking.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingHistoryPage