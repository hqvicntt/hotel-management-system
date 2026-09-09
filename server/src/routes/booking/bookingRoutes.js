/**
 * bookingRoutes.js - Định tuyến các API đặt phòng
 * 
 * Các endpoint:
 * - POST   /api/bookings                      - Tạo đơn đặt (Customer)
 * - GET    /api/bookings/my-bookings          - Lịch sử của tôi (Customer)
 * - GET    /api/bookings/:id                  - Chi tiết đơn đặt (Customer/Admin)
 * - PUT    /api/bookings/:id/cancel           - Hủy đơn đặt (Customer)
 * - GET    /api/bookings/admin/all            - Tất cả đơn đặt (Admin)
 * - PUT    /api/bookings/:id/status           - Cập nhật trạng thái (Admin)
 * - PUT    /api/bookings/:id/payment          - Cập nhật thanh toán (Admin)
 */

const express = require('express');
const router = express.Router();

// ============================================
// 1. IMPORT CONTROLLERS
// ============================================

const {
  // Customer
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  
  // Admin
  getAllBookings,
  updateBookingStatus,
  updatePaymentStatus
} = require('../../controllers/booking/bookingController');

// ============================================
// 2. IMPORT MIDDLEWARES
// ============================================

const { protect, authorize } = require('../../middlewares/auth');

// ============================================
// 3. CUSTOMER ROUTES (Cần đăng nhập)
// ============================================

/**
 * @route   POST /api/bookings
 * @desc    Tạo đơn đặt phòng mới
 * @access  Private (Customer, Staff, Admin)
 * @body    roomId, checkInDate, checkOutDate, guestCount, specialRequests
 */
router.post('/', protect, createBooking);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Lấy lịch sử đặt phòng của user hiện tại
 * @access  Private (Customer, Staff, Admin)
 * @query   status (lọc theo trạng thái)
 */
router.get('/my-bookings', protect, getMyBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Lấy chi tiết đơn đặt
 * @access  Private (Customer - chỉ của mình, Admin - tất cả)
 * @param   id - Booking ID
 */
router.get('/:id', protect, getBookingById);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Hủy đơn đặt phòng
 * @access  Private (Customer - chỉ của mình)
 * @param   id - Booking ID
 * @body    reason (optional)
 */
router.put('/:id/cancel', protect, cancelBooking);

// ============================================
// 4. ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/bookings/admin/all
 * @desc    Lấy tất cả đơn đặt phòng
 * @access  Private (Admin)
 * @query   status, limit, page, sort
 */
router.get('/admin/all', protect, authorize('admin'), getAllBookings);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Cập nhật trạng thái đơn đặt
 * @access  Private (Admin)
 * @param   id - Booking ID
 * @body    status
 */
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);

/**
 * @route   PUT /api/bookings/:id/payment
 * @desc    Cập nhật trạng thái thanh toán
 * @access  Private (Admin)
 * @param   id - Booking ID
 * @body    paymentStatus
 */
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);

// ============================================
// 5. EXPORT
// ============================================

module.exports = router;