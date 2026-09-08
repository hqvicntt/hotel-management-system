/**
 * roomService.js - Service quản lý các API liên quan đến phòng
 * 
 * Các chức năng:
 * - Lấy danh sách phòng với filter
 * - Lấy chi tiết phòng
 * - Lấy phòng trống
 * - Tạo phòng (Admin)
 * - Cập nhật phòng (Admin)
 * - Xóa phòng (Admin)
 */

import apiClient from './api.js'

// ============================================
// 1. PUBLIC SERVICES (Không cần token)
// ============================================

/**
 * Lấy danh sách tất cả phòng với hỗ trợ filter
 * @param {Object} filters - Các tham số lọc
 * @param {string} filters.type - Loại phòng (Single, Double, Suite, Deluxe)
 * @param {string} filters.status - Trạng thái phòng (Available, Booked, Maintenance)
 * @param {number} filters.minPrice - Giá tối thiểu
 * @param {number} filters.maxPrice - Giá tối đa
 * @param {number} filters.limit - Số lượng kết quả (mặc định 20)
 * @param {number} filters.page - Trang số (mặc định 1)
 * @param {string} filters.sort - Sắp xếp (price, -price, createdAt)
 * @returns {Promise<Object>} - { success, count, total, totalPages, currentPage, data }
 */
export const getAllRooms = async (filters = {}) => {
  try {
    // Xây dựng query string từ filters
    const queryParams = new URLSearchParams()
    
    if (filters.type) queryParams.append('type', filters.type)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice)
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.sort) queryParams.append('sort', filters.sort)
    
    const queryString = queryParams.toString()
    const url = `/rooms${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ getAllRooms error:', error)
    throw error
  }
}

/**
 * Lấy danh sách phòng trống (có sẵn để đặt)
 * @param {Object} filters - Bộ lọc
 * @param {string} filters.type - Loại phòng
 * @param {number} filters.minPrice - Giá tối thiểu
 * @param {number} filters.maxPrice - Giá tối đa
 * @returns {Promise<Object>} - { success, count, data }
 */
export const getAvailableRooms = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    if (filters.type) queryParams.append('type', filters.type)
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice)
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice)
    
    const queryString = queryParams.toString()
    const url = `/rooms/available${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error('❌ getAvailableRooms error:', error)
    throw error
  }
}

/**
 * Lấy chi tiết một phòng theo ID
 * @param {string} roomId - ID của phòng
 * @returns {Promise<Object>} - { success, data }
 */
export const getRoomById = async (roomId) => {
  try {
    const response = await apiClient.get(`/rooms/${roomId}`)
    return response.data
  } catch (error) {
    console.error('❌ getRoomById error:', error)
    throw error
  }
}

// ============================================
// 2. ADMIN SERVICES (Cần token + role admin)
// ============================================

/**
 * Tạo phòng mới (Chỉ Admin)
 * @param {Object} roomData - Dữ liệu phòng
 * @param {string} roomData.roomNumber - Số phòng
 * @param {string} roomData.type - Loại phòng
 * @param {number} roomData.pricePerNight - Giá mỗi đêm
 * @param {number} roomData.maxOccupants - Số người tối đa
 * @param {string} roomData.status - Trạng thái
 * @param {string} roomData.description - Mô tả
 * @param {string[]} roomData.images - URL ảnh
 * @param {string[]} roomData.amenities - Tiện ích
 * @param {number} roomData.floor - Tầng
 * @returns {Promise<Object>} - { success, message, data }
 */
export const createRoom = async (roomData) => {
  try {
    const response = await apiClient.post('/rooms', roomData)
    return response.data
  } catch (error) {
    console.error('❌ createRoom error:', error)
    throw error
  }
}

/**
 * Cập nhật thông tin phòng (Chỉ Admin)
 * @param {string} roomId - ID của phòng
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} - { success, message, data }
 */
export const updateRoom = async (roomId, updateData) => {
  try {
    const response = await apiClient.put(`/rooms/${roomId}`, updateData)
    return response.data
  } catch (error) {
    console.error('❌ updateRoom error:', error)
    throw error
  }
}

/**
 * Cập nhật trạng thái phòng (Chỉ Admin)
 * @param {string} roomId - ID của phòng
 * @param {string} status - Trạng thái mới
 * @returns {Promise<Object>} - { success, message, data }
 */
export const updateRoomStatus = async (roomId, status) => {
  try {
    const response = await apiClient.patch(`/rooms/${roomId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('❌ updateRoomStatus error:', error)
    throw error
  }
}

/**
 * Xóa phòng (Chỉ Admin)
 * @param {string} roomId - ID của phòng
 * @returns {Promise<Object>} - { success, message, data }
 */
export const deleteRoom = async (roomId) => {
  try {
    const response = await apiClient.delete(`/rooms/${roomId}`)
    return response.data
  } catch (error) {
    console.error('❌ deleteRoom error:', error)
    throw error
  }
}

// ============================================
// 3. HELPER FUNCTIONS
// ============================================

/**
 * Format giá tiền sang VNĐ
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi định dạng VNĐ
 */
export const formatPrice = (amount) => {
  if (!amount && amount !== 0) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Lấy icon cho tiện ích
 * @param {string} amenity - Tên tiện ích
 * @returns {string} - Class icon Bootstrap
 */
export const getAmenityIcon = (amenity) => {
  const iconMap = {
    'WiFi': 'bi-wifi',
    'Air Conditioning': 'bi-snow2',
    'TV': 'bi-tv',
    'Mini Bar': 'bi-cup-straw',
    'Bathtub': 'bi-droplet',
    'Balcony': 'bi-window',
    'Kitchen': 'bi-egg-fried',
    'Parking': 'bi-car-front'
  }
  return iconMap[amenity] || 'bi-check-circle'
}