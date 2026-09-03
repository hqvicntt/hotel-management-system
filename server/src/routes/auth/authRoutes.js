/**
 * AUTH ROUTES - Định tuyến các API xác thực
 * 
 * Các endpoint:
 * POST   /api/auth/register  - Đăng ký (Public)
 * POST   /api/auth/login     - Đăng nhập (Public)
 * GET    /api/auth/me        - Lấy thông tin user hiện tại (Private)
 * POST   /api/auth/logout    - Đăng xuất (Private)
 */

const express = require('express');
const router = express.Router();

// Import controller
const {
  register,
  login,
  getMe,
  logout
} = require('../../controllers/auth/authController');

// Import middleware
const { protect } = require('../../middlewares/auth');

// ============================================
// ĐỊNH TUYẾN CÔNG KHAI (Public Routes)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 * @body    { name, email, password, phone, role? }
 * @returns { token, user }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập vào hệ thống
 * @access  Public
 * @body    { email, password }
 * @returns { token, user }
 */
router.post('/login', login);

// ============================================
// ĐỊNH TUYẾN RIÊNG TƯ (Private Routes)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user đang đăng nhập
 * @access  Private (Cần token)
 * @headers Authorization: Bearer <token>
 * @returns { user }
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất (Client-side)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', protect, logout);

module.exports = router;