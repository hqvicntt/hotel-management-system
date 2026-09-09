/**
 * Booking.js - Model quản lý đơn đặt phòng
 * 
 * Cấu trúc dữ liệu:
 * - bookingCode: Mã đặt phòng tự động sinh (định dạng: BK-20260908-XXXX)
 * - customerId: ID của khách hàng (ref: User)
 * - roomId: ID của phòng (ref: Room)
 * - checkInDate: Ngày nhận phòng
 * - checkOutDate: Ngày trả phòng
 * - totalAmount: Tổng tiền (tự động tính)
 * - status: Trạng thái đơn đặt
 * - paymentStatus: Trạng thái thanh toán
 * - guestCount: Số lượng khách
 * - specialRequests: Yêu cầu đặc biệt
 * - cancelledAt: Thời gian hủy
 * - cancelledReason: Lý do hủy
 * - checkedInAt: Thời gian nhận phòng thực tế
 * - checkedOutAt: Thời gian trả phòng thực tế
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // ==========================================
  // 1. MÃ ĐẶT PHÒNG (Tự động sinh)
  // ==========================================
  
  bookingCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },

  // ==========================================
  // 2. LIÊN KẾT DỮ LIỆU
  // ==========================================
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng cung cấp ID khách hàng']
  },
  
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Vui lòng cung cấp ID phòng']
  },

  // ==========================================
  // 3. THÔNG TIN ĐẶT PHÒNG
  // ==========================================
  
  checkInDate: {
    type: Date,
    required: [true, 'Vui lòng cung cấp ngày nhận phòng']
  },
  
  checkOutDate: {
    type: Date,
    required: [true, 'Vui lòng cung cấp ngày trả phòng']
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Tổng tiền không thể là số âm']
  },
  
  guestCount: {
    type: Number,
    required: [true, 'Vui lòng cung cấp số lượng khách'],
    min: [1, 'Số lượng khách phải ít nhất là 1'],
    max: [10, 'Số lượng khách không được quá 10']
  },
  
  specialRequests: {
    type: String,
    maxlength: [500, 'Yêu cầu đặc biệt không được vượt quá 500 ký tự'],
    default: ''
  },

  // ==========================================
  // 4. TRẠNG THÁI
  // ==========================================
  
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid',
    index: true
  },

  // ==========================================
  // 5. THỜI GIAN THỰC TẾ
  // ==========================================
  
  cancelledAt: {
    type: Date,
    default: null
  },
  
  cancelledReason: {
    type: String,
    maxlength: [500, 'Lý do hủy không được vượt quá 500 ký tự'],
    default: ''
  },
  
  checkedInAt: {
    type: Date,
    default: null
  },
  
  checkedOutAt: {
    type: Date,
    default: null
  },

  // ==========================================
  // 6. THÔNG TIN LIÊN HỆ (Lưu snapshot)
  // ==========================================
  
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },

  // ==========================================
  // 7. THỜI GIAN TẠO
  // ==========================================
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ==========================================
// 8. INDEXES (Tối ưu truy vấn)
// ==========================================

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// ==========================================
// 9. VIRTUAL PROPERTIES
// ==========================================

/**
 * Virtual: Số đêm ở
 */
bookingSchema.virtual('nightCount').get(function() {
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = this.checkOutDate - this.checkInDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

/**
 * Virtual: Phòng đã được check-in chưa
 */
bookingSchema.virtual('isCheckedIn').get(function() {
  return this.status === 'CheckedIn';
});

/**
 * Virtual: Có thể hủy không
 */
bookingSchema.virtual('canCancel').get(function() {
  const cancellableStatuses = ['Pending', 'Confirmed'];
  return cancellableStatuses.includes(this.status) && this.paymentStatus !== 'Paid';
});

// ==========================================
// 10. METHODS
// ==========================================

/**
 * Cập nhật trạng thái đơn đặt
 */
bookingSchema.methods.updateStatus = async function(newStatus) {
  const validStatuses = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trạng thái không hợp lệ: ${newStatus}`);
  }

  // Cập nhật thời gian tương ứng
  if (newStatus === 'CheckedIn') {
    this.checkedInAt = new Date();
  }
  if (newStatus === 'CheckedOut') {
    this.checkedOutAt = new Date();
  }
  if (newStatus === 'Cancelled') {
    this.cancelledAt = new Date();
  }

  this.status = newStatus;
  return await this.save();
};

/**
 * Hủy đơn đặt
 */
bookingSchema.methods.cancel = async function(reason = '') {
  if (!this.canCancel) {
    throw new Error('Không thể hủy đơn đặt này');
  }
  this.cancelledReason = reason || 'Khách hàng hủy đơn';
  return await this.updateStatus('Cancelled');
};

// ==========================================
// 11. STATIC METHODS
// ==========================================

/**
 * Lấy danh sách booking của một user
 */
bookingSchema.statics.getUserBookings = function(userId, filters = {}) {
  const query = { customerId: userId };
  if (filters.status) query.status = filters.status;
  
  return this.find(query)
    .populate('roomId', 'roomNumber type pricePerNight images')
    .sort({ createdAt: -1 });
};

/**
 * Kiểm tra phòng có bị trùng ngày không
 */
bookingSchema.statics.isRoomAvailable = async function(roomId, checkIn, checkOut) {
  const conflictingBooking = await this.findOne({
    roomId,
    status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] },
    $or: [
      { checkInDate: { $lt: checkOut, $gte: checkIn } },
      { checkOutDate: { $gt: checkIn, $lte: checkOut } },
      { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
    ]
  });
  return !conflictingBooking;
};

/**
 * Tạo mã đặt phòng tự động
 */
bookingSchema.statics.generateBookingCode = function() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  // Tạo chuỗi ngẫu nhiên 4 ký tự
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `BK-${dateStr}-${randomStr}`;
};

// ==========================================
// 12. EXPORT
// ==========================================

module.exports = mongoose.model('Booking', bookingSchema);