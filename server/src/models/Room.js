/**
 * Room.js - Model quản lý phòng trong hệ thống khách sạn
 * 
 * Cấu trúc dữ liệu:
 * - roomNumber: Số phòng (duy nhất)
 * - type: Loại phòng (Single, Double, Suite, Deluxe)
 * - pricePerNight: Giá mỗi đêm
 * - maxOccupants: Số người tối đa
 * - status: Trạng thái phòng (Available, Booked, Maintenance)
 * - description: Mô tả chi tiết
 * - images: Mảng các URL ảnh
 * 
 * Ràng buộc dữ liệu:
 * - roomNumber: unique, required
 * - type: enum, required
 * - pricePerNight: number, min 0
 * - maxOccupants: number, min 1
 * - status: enum, default 'Available'
 * - images: array of strings, validate URL format
 */

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // ==========================================
  // 1. THÔNG TIN CƠ BẢN
  // ==========================================
  
  roomNumber: {
    type: String,
    required: [true, 'Vui lòng cung cấp số phòng'],
    unique: true, // Không trùng lặp
    trim: true,
    uppercase: true, // Tự động chuyển sang chữ hoa (VD: 101, 102A)
    index: true // Tạo index để tìm kiếm nhanh
  },
  
  type: {
    type: String,
    enum: ['Single', 'Double', 'Suite', 'Deluxe'],
    required: [true, 'Vui lòng chọn loại phòng'],
    index: true
  },
  
  // ==========================================
  // 2. GIÁ CẢ & SỨC CHỨA
  // ==========================================
  
  pricePerNight: {
    type: Number,
    required: [true, 'Vui lòng cung cấp giá phòng'],
    min: [0, 'Giá phòng không thể là số âm'],
    set: (value) => Math.round(value * 100) / 100 // Làm tròn 2 chữ số thập phân
  },
  
  maxOccupants: {
    type: Number,
    required: [true, 'Vui lòng cung cấp số người tối đa'],
    min: [1, 'Số người tối đa phải ít nhất là 1'],
    max: [10, 'Số người tối đa không được quá 10']
  },
  
  // ==========================================
  // 3. TRẠNG THÁI
  // ==========================================
  
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance', 'Cleaning'],
    default: 'Available',
    index: true // Phục vụ lọc phòng theo trạng thái
  },
  
  // ==========================================
  // 4. MÔ TẢ & HÌNH ẢNH
  // ==========================================
  
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự'],
    default: ''
  },
  
  images: {
    type: [String], // Mảng các URL
    default: [],
    validate: {
      validator: function(images) {
        // Kiểm tra mỗi URL có đúng định dạng không
        return images.every(url => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        });
      },
      message: 'Mỗi URL ảnh phải là địa chỉ hợp lệ'
    }
  },
  
  // ==========================================
  // 5. TIỆN ÍCH BỔ SUNG
  // ==========================================
  
  amenities: {
    type: [String],
    enum: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Bathtub', 'Balcony', 'Kitchen', 'Parking'],
    default: []
  },
  
  floor: {
    type: Number,
    min: 0,
    max: 50,
    default: 1
  },
  
  // ==========================================
  // 6. THỜI GIAN
  // ==========================================
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// ==========================================
// 7. INDEXES (Tối ưu truy vấn)
// ==========================================

roomSchema.index({ type: 1, status: 1 }); // Lọc theo loại và trạng thái
roomSchema.index({ pricePerNight: 1 }); // Sắp xếp theo giá

// ==========================================
// 8. VIRTUAL PROPERTIES
// ==========================================

// Virtual field: Lấy tên hiển thị đầy đủ của phòng
roomSchema.virtual('displayName').get(function() {
  return `${this.type} - Phòng ${this.roomNumber}`;
});

// ==========================================
// 9. METHODS
// ==========================================

/**
 * Kiểm tra phòng có sẵn để đặt không
 * @returns {boolean}
 */
roomSchema.methods.isAvailable = function() {
  return this.status === 'Available';
};

/**
 * Cập nhật trạng thái phòng với kiểm tra hợp lệ
 * @param {string} newStatus - Trạng thái mới
 * @returns {Promise<this>}
 */
roomSchema.methods.updateStatus = async function(newStatus) {
  const validStatuses = ['Available', 'Booked', 'Maintenance', 'Cleaning'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trạng thái không hợp lệ: ${newStatus}`);
  }
  this.status = newStatus;
  return await this.save();
};

// ==========================================
// 10. STATIC METHODS
// ==========================================

/**
 * Lấy danh sách phòng có sẵn theo tiêu chí
 * @param {Object} filters - Bộ lọc (type, minPrice, maxPrice)
 * @returns {Promise<Array>}
 */
roomSchema.statics.getAvailableRooms = function(filters = {}) {
  const query = { status: 'Available' };
  
  if (filters.type) query.type = filters.type;
  if (filters.minPrice) query.pricePerNight = { $gte: filters.minPrice };
  if (filters.maxPrice) {
    query.pricePerNight = { ...query.pricePerNight, $lte: filters.maxPrice };
  }
  
  return this.find(query).sort({ pricePerNight: 1 });
};

// ==========================================
// 11. MIDDLEWARE (HOOKS)
// ==========================================

// Trước khi xóa, kiểm tra xem phòng có đang được book không
roomSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Booking = mongoose.model('Booking');
  const hasActiveBooking = await Booking.exists({
    roomId: this._id,
    status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] }
  });
  
  if (hasActiveBooking) {
    throw new Error('Không thể xóa phòng đang có đơn đặt hoạt động');
  }
});

// ==========================================
// 12. EXPORT
// ==========================================

module.exports = mongoose.model('Room', roomSchema);