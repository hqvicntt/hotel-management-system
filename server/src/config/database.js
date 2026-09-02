// Khai báo thư viện: Dòng này nạp thư viện mongoose đã cài bằng lệnh npm install vào file
const mongoose = require('mongoose');

// Khởi tạo hàm kết nối bất đồng bộ
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Lắng nghe sự kiện lỗi phát sinh khi đang chạy
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    // Lắng nghe sự kiện mất kết nối đột ngột
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Xử lý tắt ứng dụng an toàn (Graceful Shutdown)
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) { // Khối bẫy lỗi ban đầu
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Xuất hàm: Đóng gói hàm này lại để các file khác trong dự án (cụ thể là file src/app.js) có thể gọi ra và sử dụng được bằng lệnh require
module.exports = connectDB;