const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please provide a room number'],
    unique: true, // Bắt buộc số phòng không được phép trùng nhau trong hệ thống
    trim: true
  },
  type: {
    type: String,
    enum: ['Single', 'Double', 'Suite', 'Deluxe'],
    required: [true, 'Please specify room type']
  },
  pricePerNight: { // Giá mỗi đêm
    type: Number,
    required: [true, 'Please provide price per night'],
    min: [0, 'Price must be greater than 0'] // Đảm bảo giá phòng nhập vào không bao giờ được là số âm
  },
  maxOccupants: { // Số người ở tối đa trong 1 phòng
    type: Number,
    required: [true, 'Please specify max occupants'],
    min: [1, 'Max occupants must be at least 1'] // bắt buộc một phòng phải chứa được ít nhất 1 người, không thể tạo phòng có số người ở bằng 0 hoặc âm
  },
  status: { // Trạng thái phòng
    type: String,
    enum: ['Available', 'Booked', 'Maintenance'],
    default: 'Available'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  images: [{ // Mảng chứa chuỗi ([{ type: String }]): Một căn phòng cần có nhiều góc chụp để khách xem. Cú pháp dấu đóng mở ngoặc vuông [...] báo cho MongoDB biết đây là một mảng (Array), cho phép lưu nhiều đường link ảnh cùng lúc cho một căn phòng
    type: String,
    validate: { // Bộ kiểm tra định dạng ảnh (validate): Đoạn code dùng biểu thức chính quy (Regex) để kiểm tra từng đường link ảnh được thêm vào. Nếu link ảnh không bắt đầu bằng http:// hoặc https://, hệ thống sẽ chặn lại ngay và xuất thông báo lỗi, đảm bảo phía Frontend (ReactJS) sau này gọi link ra hiển thị không bị lỗi ảnh vỡ
      validator: function(v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Đóng gói lại thành Model tên Room để chuẩn bị phục vụ cho các tính năng CRUD (Thêm, Sửa, Xóa phòng) ở tầng Controller
module.exports = mongoose.model('Room', roomSchema);