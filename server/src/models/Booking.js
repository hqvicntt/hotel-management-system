const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Kỹ thuật Liên kết Dữ liệu (tạo mối liên kết giữa các Collection trong MongoDB (NoSQL) giống như Khóa ngoại (Foreign Key) của SQL) duoc ap dung o 2 truong: customerId va roomId
  customerId: {
    type: mongoose.Schema.Types.ObjectId, // Khai báo rằng trường này không lưu chuỗi chữ bình thường, mà sẽ lưu một đoạn mã ID đặc trưng (chuỗi 24 ký tự) do MongoDB tự sinh ra cho mỗi User
    ref: 'User', // Ra lệnh cho Mongoose hiểu rằng: "Cái ID này chính là chìa khóa để tìm sang bảng User đấy!". Sau này khi làm tính năng hiển thị đơn đặt phòng, nhờ dòng này mà ta có thể dùng lệnh .populate() để tự động bốc tên, email, số điện thoại của khách hàng ra một cách dễ dàng
    required: [true, 'Customer ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  checkInDate: { // Mốc thời gian khách bắt đầu nhận phòng
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOutDate: { // Mốc thời gian khách trả phòng
    type: Date,
    required: [true, 'Check-out date is required']
  },
  totalAmount: { // Tổng tiền
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount must be greater than 0']
  },
  status: { // Trạng thái đơn đặt
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'CheckedIn', 'CheckedOut'],
    default: 'Pending'
  },
  paymentStatus: { // Trạng thái thanh toán
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Logic Đánh Chặn Bảo Vệ Dữ Liệu (Hàm pre-save)
// Trước khi một đơn đặt phòng được lưu xuống database, hàm này sẽ tự động chạy để kiểm tra logic thời gian
// Một người không thể trả phòng (checkOutDate) trước hoặc cùng ngày với ngày nhận phòng (checkInDate). Nếu người dùng cố tình hoặc vô ý chọn ngày trả phòng là ngày hôm qua, đoạn code này sẽ ngay lập tức chặn đứng lại, ném ra một lỗi (Error) và không cho phép lưu đơn hàng lỗi đó vào database
bookingSchema.pre('save', function(next) {
  if (this.checkInDate >= this.checkOutDate) {
    next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
// Cả 3 "bảng dữ liệu" cốt lõi của hệ thống: User (Ai đặt) ➔ Room (Đặt phòng nào) ➔ Booking (Đặt khi nào, bao nhiêu tiền)