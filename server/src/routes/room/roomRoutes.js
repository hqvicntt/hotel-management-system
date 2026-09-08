/**
 * roomRoutes.js - Định tuyến các API quản lý phòng
 * 
 * Các endpoint:
 * - GET    /api/rooms             - Lấy danh sách phòng (Public)
 * - GET    /api/rooms/available   - Lấy phòng trống (Public)
 * - GET    /api/rooms/:id         - Lấy chi tiết phòng (Public)
 * - POST   /api/rooms             - Tạo phòng mới (Admin)
 * - PUT    /api/rooms/:id         - Cập nhật phòng (Admin)
 * - PATCH  /api/rooms/:id/status  - Cập nhật trạng thái (Admin)
 * - DELETE /api/rooms/:id         - Xóa phòng (Admin)
 */

const express = require('express');
const router = express.Router();

// ============================================
// 1. IMPORT CONTROLLERS
// ============================================

const {
  // Public
  getRooms,
  getRoomById,
  getAvailableRooms,
  
  // Admin
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus
} = require('../../controllers/room/roomController');

// ============================================
// 2. IMPORT MIDDLEWARES
// ============================================

const { protect, authorize } = require('../../middlewares/auth');

// ============================================
// 3. PUBLIC ROUTES (Không cần xác thực)
// ============================================

/**
 * @route   GET /api/rooms
 * @desc    Lấy danh sách phòng với filter & phân trang
 * @access  Public
 * @query   type, status, minPrice, maxPrice, limit, page, sort
 */
router.get('/', getRooms);

/**
 * @route   GET /api/rooms/available
 * @desc    Lấy danh sách phòng trống (có sẵn để đặt)
 * @access  Public
 * @query   type, minPrice, maxPrice
 */
router.get('/available', getAvailableRooms);

/**
 * @route   GET /api/rooms/:id
 * @desc    Lấy chi tiết một phòng
 * @access  Public
 * @param   id - Room ID
 */
router.get('/:id', getRoomById);

// ============================================
// 4. ADMIN ROUTES (Cần xác thực + phân quyền)
// ============================================

/**
 * @route   POST /api/rooms
 * @desc    Tạo phòng mới
 * @access  Private (Admin)
 * @body    roomNumber, type, pricePerNight, maxOccupants, status, description, images, amenities, floor
 */
router.post('/', protect, authorize('admin'), createRoom);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Cập nhật thông tin phòng
 * @access  Private (Admin)
 * @param   id - Room ID
 * @body    roomNumber, type, pricePerNight, maxOccupants, status, description, images, amenities, floor
 */
router.put('/:id', protect, authorize('admin'), updateRoom);

/**
 * @route   PATCH /api/rooms/:id/status
 * @desc    Cập nhật trạng thái phòng
 * @access  Private (Admin)
 * @param   id - Room ID
 * @body    status: 'Available' | 'Booked' | 'Maintenance' | 'Cleaning'
 */
router.patch('/:id/status', protect, authorize('admin'), updateRoomStatus);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Xóa phòng
 * @access  Private (Admin)
 * @param   id - Room ID
 * @note    Chỉ xóa được khi không có đơn đặt hoạt động
 */
router.delete('/:id', protect, authorize('admin'), deleteRoom);

// ============================================
// 5. EXPORT
// ============================================

module.exports = router;