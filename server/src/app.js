// File src/app.js chính là "Tổng hành dinh" (Master File) của toàn bộ ứng dụng Backend. Nhiệm vụ của nó là nạp các cấu hình, kích hoạt kết nối cơ sở dữ liệu, thiết lập các bộ lọc bảo mật, định nghĩa đường dẫn API và chính thức ra lệnh cho Server phát sóng ra môi trường mạng

// Nạp Cấu Hình Toàn Cục Và Thư Viện Lõi
require('dotenv').config(); // require('dotenv').config() (Phải đặt ở dòng đầu tiên): Ra lệnh cho hệ thống đọc ngay file mật bảo .env, bốc các biến như PORT, MONGODB_URI nạp vào bộ nhớ của NodeJS để các file phía sau có thể sử dụng được qua cú pháp process.env
const express = require('express'); // Nạp framework ExpressJS – bộ công cụ giúp chúng ta xây dựng Web Server cực kỳ gọn nhẹ
const cors = require('cors'); // Bật CORS: Mở cửa cho phép Frontend cổng 3000 chuẩn bị vào lấy dữ liệu
const connectDB = require('./config/database'); // Gọi file cấu hình database
const errorHandler = require('./middlewares/errorHandler'); // Gọi file xử lý lỗi tập trung

// Khởi Tạo Ứng Dụng
const app = express(); // Tạo ra một đối tượng đại diện cho ứng dụng Web Server của bạn. Mọi cấu hình hay tính năng sau này đều sẽ được gắn vào biến app này

// Kích Hoạt Database
connectDB(); // Gọi hàm chạy liên lạc xuống MongoDB Service ngầm của Windows. Nhờ lệnh này mà Terminal của bạn đã in dòng chữ xanh báo kết nối thành công

// Cấu Hình Các Bộ Lọc Cửa Ngõ (Middlewares toàn cục)
app.use(cors({ // cors(...) (Cực kỳ quan trọng): Kích hoạt cơ chế chia sẻ tài nguyên giữa các nguồn khác nhau. Đoạn code này lấy giá trị CLIENT_URL (http://localhost:3000) từ file .env ra để cấp quyền cho duy nhất ứng dụng ReactJS (Frontend) sau này được phép gửi yêu cầu vượt qua trình duyệt để vào lấy dữ liệu từ server NodeJS
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' })); // express.json(): Đóng vai trò là "Bộ dịch mã". Khi Frontend gửi dữ liệu lên dạng chuỗi JSON (ví dụ thông tin đặt phòng), bộ lọc này tự động dịch nó thành một đối tượng JavaScript (req.body) để code Backend của bạn đọc được
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // limit: '10mb': Giới hạn dung lượng tối đa của một gói dữ liệu gửi lên là 10MB. Việc nâng lên 10MB là để chuẩn bị cho tính năng Admin tải ảnh phòng khách sạn lên hệ thống không bị báo lỗi tràn dung lượng

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev')); // morgan('dev'): Bộ lọc ghi nhật ký. Nếu biến môi trường đang là development (lập trình), mỗi khi bạn hoặc Frontend gọi một API, Morgan sẽ lập tức in một dòng log ra Terminal (Ví dụ: GET /api/health 200 4.120 ms). Điều này giúp bạn nhìn thấy luồng chạy của mạng để tiện sửa lỗi (debug)
}

// Định Nghĩa Các Tuyến Đường API (Routes)
// Health Check API: Đây là đường dẫn kiểm tra sức khỏe của server mà tối qua bạn đã dán vào trình duyệt web. Khi truy cập GET /api/health, server sẽ trả về mã trạng thái thành công 200 OK kèm chuỗi thông tin báo server vẫn đang sống khỏe mạnh
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(), // thời gian thực chính xác đến từng mili-giây của máy tính (new Date().toISOString())
    environment: process.env.NODE_ENV
  });
});

// Đây là nơi tập trung đầu mối dẫn đường. Khi bạn viết xong các tính năng thực tế, bạn sẽ mở comment ra để dẫn hướng: Ví dụ cứ gọi đường dẫn bắt đầu bằng /api/rooms thì NodeJS sẽ chuyển tiếp gói tin vào file roomRoutes.js để xử lý sâu hơn
// API Routes (will be added later)
// app.use('/api/auth', require('./routes/auth/authRoutes'));
// app.use('/api/rooms', require('./routes/room/roomRoutes'));
// app.use('/api/bookings', require('./routes/booking/bookingRoutes'));
// app.use('/api/users', require('./routes/user/userRoutes'));
// app.use('/api/dashboard', require('./routes/dashboard/dashboardRoutes'));

// app.use(errorHandler) (Phải đặt ở cuối khu vực cấu hình): Gắn "Trạm xử lý sự cố tập trung" vào hệ thống. Mọi lỗi phát sinh ở tầng Route hay Controller phía trên nếu không giải quyết được sẽ tự động bị đẩy tuột xuống file errorHandler.js này để xử lý đầu ra
app.use(errorHandler);

// 404 handler: Nếu người dùng gõ bừa một đường dẫn không tồn tại (ví dụ: /api/thong-tin-bua-vua), hệ thống không tìm thấy route nào khớp sẽ chạy xuống dòng này và trả về mã lỗi 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => { // app.listen(PORT): Lệnh chính thức kích hoạt server chiếm dụng cổng số 5000 để bắt đầu "phát sóng" ra môi trường mạng
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API Health check: http://localhost:${PORT}/api/health`);
});

// Bộ Giáp Bảo Vệ Sập App Đột Ngột
// Cơ chế: Khi gặp phải 2 loại lỗi tử thần này, thay vì để mặc cho ứng dụng bị đơ hoặc treo máy vô thời hạn, đoạn code này sẽ ra lệnh cho server: In lỗi ra màn hình ➔ Đóng cổng mạng một cách an toàn (server.close()) ➔ Tắt hẳn ứng dụng hoàn toàn để công cụ quản lý hệ thống biết đường tự động kích hoạt khởi động lại ứng dụng mới
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => { // unhandledRejection: Bắt các lỗi bất đồng bộ (Promise) bị thất bại mà lập trình viên quên viết khối lệnh catch
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => { // uncaughtException: Bắt các lỗi cú pháp nghiêm trọng xảy ra bất ngờ ở tầng sâu của hệ thống
  console.error(`❌ Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;