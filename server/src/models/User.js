const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({ // Định nghĩa Khung Dữ liệu (userSchema)
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true, // Tự động xóa khoảng trắng thừa ở hai đầu
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true, // Email không được trùng nhau trong hệ thống
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Hệ thống sẽ tự động giấu trường mật khẩu đi. Điều này ngăn chặn việc vô tình làm rò rỉ mật khẩu băm ra phía Frontend
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^[0-9]{10,11}$/, 'Please provide a valid phone number'] // số điện thoại nhập vào chỉ chứa các chữ số từ 0-9 và có độ dài từ 10 đến 11 ký tự
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Tự động tạo thêm 2 trường dữ liệu là createdAt (Thời gian tạo tài khoản) và updatedAt (Thời gian cập nhật tài khoản gần nhất) mà không cần phải tự gõ code chèn vào
});

// Đây là một hàm đánh chặn (Hook). Trước khi dữ liệu người dùng được chính thức lưu (save) xuống MongoDB, Mongoose sẽ tự động nhảy vào đoạn code này để xử lý mật khẩu
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return; // Nếu người dùng chỉ cập nhật số điện thoại hay tên (mật khẩu không đổi), hàm này sẽ bỏ qua và chạy tiếp (next())
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Hàm này nhận vào mật khẩu do người dùng gõ khi đăng nhập (enteredPassword), dùng thư viện bcrypt để giải mã và đối chiếu với mật khẩu đã băm trong DB (this.password). Nó sẽ trả về true nếu khớp và false nếu sai
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Đóng gói toàn bộ cấu hình trên thành một Model có tên là User và xuất ra ngoài để các file khác gọi vào sử dụng (ví dụ hàm tạo tài khoản, hàm tìm kiếm tài khoản)
module.exports = mongoose.model('User', userSchema);