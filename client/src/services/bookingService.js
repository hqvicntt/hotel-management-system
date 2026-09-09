/**
 * bookingService.js - Service quản lý các API liên quan đến đặt phòng
 * 
 * Các chức năng:
 * - Tạo đơn đặt phòng mới
 * - Lấy lịch sử đặt phòng của user
 * - Lấy chi tiết đơn đặt
 * - Hủy đơn đặt phòng
 * - Admin: Lấy tất cả đơn đặt, cập nhật trạng thái
 */

import apiClient from './api.js'

// ============================================
// 1. CUSTOMER SERVICES
// ============================================

/**
 * Tạo đơn đặt phòng mới
 * @param {Object} bookingData - Dữ liệu đặt phòng
 * @param {string} bookingData.roomId - ID của phòng
 * @param {string} bookingData.checkInDate - Ngày nhận phòng (ISO)
 * @param {string} bookingData.checkOutDate - Ngày trả phòng (ISO)
 * @param {number} bookingData.guestCount - Số lượng khách
 * @param {string} bookingData.specialRequests - Yêu cầu đặc biệt
 * @returns {Promise<Object>} - { success, message, data }
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await apiClient.post('/bookings', bookingData)
    return response.data
  } catch (error) {
    console.error('❌ createBooking error:', error)
    throw error
  }
}

/**
 * Lấy lịch sử đặt phòng của user hiện tại
 * @param {Object} filters - Bộ lọc
 * @param {string} filters.status - Lọc theo trạng thái
 * @returns {Promise<Object>} - { success, count, data }
 */
export const getMyBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    
    const queryString = queryParams.toString()
    const url = `/bookings/my-bookings${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ getMyBookings error:', error)
    throw error
  }
}

/**
 * Lấy chi tiết một đơn đặt phòng
 * @param {string} bookingId - ID của đơn đặt
 * @returns {Promise<Object>} - { success, data }
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}`)
    return response.data
  } catch (error) {
    console.error('❌ getBookingById error:', error)
    throw error
  }
}

/**
 * Hủy đơn đặt phòng
 * @param {string} bookingId - ID của đơn đặt
 * @param {string} reason - Lý do hủy
 * @returns {Promise<Object>} - { success, message, data }
 */
export const cancelBooking = async (bookingId, reason = '') => {
  try {
    const response = await apiClient.put(`/bookings/${bookingId}/cancel`, { reason })
    return response.data
  } catch (error) {
    console.error('❌ cancelBooking error:', error)
    throw error
  }
}

// ============================================
// 2. ADMIN SERVICES
// ============================================

/**
 * Lấy tất cả đơn đặt phòng (Admin)
 * @param {Object} filters - Bộ lọc
 * @param {string} filters.status - Lọc theo trạng thái
 * @param {number} filters.limit - Số lượng kết quả
 * @param {number} filters.page - Trang số
 * @param {string} filters.sort - Sắp xếp
 * @returns {Promise<Object>} - { success, count, total, totalPages, currentPage, data }
 */
export const getAllBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.sort) queryParams.append('sort', filters.sort)
    
    const queryString = queryParams.toString()
    const url = `/bookings/admin/all${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ getAllBookings error:', error)
    throw error
  }
}

/**
 * Cập nhật trạng thái đơn đặt (Admin)
 * @param {string} bookingId - ID của đơn đặt
 * @param {string} status - Trạng thái mới
 * @returns {Promise<Object>} - { success, message, data }
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('❌ updateBookingStatus error:', error)
    throw error
  }
}

/**
 * Cập nhật trạng thái thanh toán (Admin)
 * @param {string} bookingId - ID của đơn đặt
 * @param {string} paymentStatus - Trạng thái thanh toán mới
 * @returns {Promise<Object>} - { success, message, data }
 */
export const updatePaymentStatus = async (bookingId, paymentStatus) => {
  try {
    const response = await apiClient.put(`/bookings/${bookingId}/payment`, { paymentStatus })
    return response.data
  } catch (error) {
    console.error('❌ updatePaymentStatus error:', error)
    throw error
  }
}

// ============================================
// 3. HELPER FUNCTIONS
// ============================================

/**
 * Format ngày tháng
 * @param {string|Date} date - Ngày cần format
 * @returns {string} - Chuỗi ngày tháng đã format
 */
export const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Lấy màu sắc cho trạng thái đơn đặt
 */
export const getStatusColor = (status) => {
  const colors = {
    'Pending': 'warning',
    'Confirmed': 'primary',
    'CheckedIn': 'info',
    'CheckedOut': 'success',
    'Cancelled': 'danger'
  }
  return colors[status] || 'secondary'
}

/**
 * Lấy label cho trạng thái đơn đặt (tiếng Việt)
 */
export const getStatusLabel = (status) => {
  const labels = {
    'Pending': 'Chờ duyệt',
    'Confirmed': 'Đã xác nhận',
    'CheckedIn': 'Đã nhận phòng',
    'CheckedOut': 'Đã trả phòng',
    'Cancelled': 'Đã hủy'
  }
  return labels[status] || status
}

/**
 * Lấy màu sắc cho trạng thái thanh toán
 */
export const getPaymentColor = (status) => {
  const colors = {
    'Unpaid': 'danger',
    'Paid': 'success',
    'Refunded': 'secondary'
  }
  return colors[status] || 'secondary'
}

/**
 * Lấy label cho trạng thái thanh toán (tiếng Việt)
 */
export const getPaymentLabel = (status) => {
  const labels = {
    'Unpaid': 'Chưa thanh toán',
    'Paid': 'Đã thanh toán',
    'Refunded': 'Đã hoàn tiền'
  }
  return labels[status] || status
}