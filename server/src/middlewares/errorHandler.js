// File src/middlewares/errorHandler.js đóng vai trò là "Trạm xử lý sự cố tập trung" của Backend.
// Trong một dự án thực tế, thay vì ở mỗi hàm (như Đăng ký, Đặt phòng, Sửa phòng) bạn đều phải viết code trả về thông báo lỗi riêng biệt, bạn chỉ cần ném lỗi đó ra. File errorHandler.js này đứng ở cuối luồng, tự động hứng lấy, phân tích xem đó là lỗi gì, rồi "dịch" lại thành những thông báo JSON rất gọn gàng, lịch sự để gửi về cho phía Frontend (ReactJS) hiển thị lên màn hình
const errorHandler = (err, req, res, next) => { // Tham số err ở đầu: Đây là dấu hiệu nhận biết một Middleware xử lý lỗi trong ExpressJS (nó có 4 tham số thay vì 3 tham số như middleware thông thường). Bất cứ khi nào hệ thống có lỗi, Express sẽ tự động chuyển gói tin lỗi vào biến err này
  // 1. Khởi tạo và bắt lỗi mặc định
  let error = { ...err };
  error.message = err.message;

  // In chi tiết lỗi gốc ra màn hình Terminal của VS Code để chính bạn (người lập trình) nhìn thấy đường dẫn lỗi mà sửa code
  console.error(err);

  // "Bẫy" lỗi số 1: Sai định dạng ID (CastError - Lỗi 404)
  // Tình huống thực tế: Khách truy cập vào chi tiết một phòng bằng đường dẫn có ID phòng: /api/rooms/64f123.... Nhưng họ vô tình gõ thừa hoặc thiếu 1 ký tự trong chuỗi ID, MongoDB không thể tìm thấy định dạng ID này và ném ra lỗi CastError
  // Cách xử lý: Đoạn code bẫy lỗi này lập tức chặn lại, chuyển mã trạng thái thành 404 (Không tìm thấy tài nguyên) và trả về câu thông báo: "Không tìm thấy tài nguyên với ID này", thay vì ném ra một đống lỗi hệ thống đen ngòm làm hoang mang người dùng
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { statusCode: 404, message };
  }

  // "Bẫy" lỗi số 2: Trùng lặp dữ liệu duy nhất (Code 11000 - Lỗi 400)
  // Tình huống thực tế: Trong file User.js bạn đã cấu hình email: { unique: true }. Nếu một khách hàng mới vào đăng ký tài khoản bằng một email đã tồn tại trong hệ thống, MongoDB sẽ từ chối lưu và ném ra mã lỗi đặc trưng là 11000
  // Cách xử lý: Đoạn code này bốc ra chính xác tên trường bị trùng (field - ví dụ là trường email) và dịch lại thành thông báo: "Giá trị trường email đã bị trùng lặp", đồng thời trả về mã lỗi 400 (Bad Request - Yêu cầu không hợp lệ)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value entered for ${field}`;
    error = { statusCode: 400, message };
  }

  // "Bẫy" lỗi số 3: Vi phạm ràng buộc dữ liệu (ValidationError - Lỗi 400)
  // Tình huống thực tế: Khi tạo phòng mới, Admin để trống giá tiền, hoặc gõ mật khẩu đăng ký dưới 6 ký tự. Lúc này các ràng buộc required hoặc minlength trong file Model sẽ kích hoạt lỗi ValidationError
  // Cách xử lý: Mongoose sẽ ném ra một mảng lỗi rất loằng ngoằng. Đoạn code này dùng hàm .map() để lọc lấy duy nhất những chuỗi thông báo mà bạn đã tự viết trong Model (Ví dụ: "Please provide a room number", "Password must be at least 6 characters"), gom chúng lại thành một thông báo sạch sẽ gửi về Frontend
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message };
  }

  // Cuối cùng, nếu lỗi rơi vào 3 trường hợp trên, hệ thống sẽ trả về đúng statusCode (400 hoặc 404) cùng lời nhắn tương ứng
  // Nếu là một lỗi lạ chưa từng có (ví dụ: mất kết nối cơ sở dữ liệu ngầm), hệ thống sẽ mặc định trả về mã 500 (Internal Server Error - Lỗi hệ thống bên trong) và dòng chữ chung chung 'Server Error' để bảo mật hệ thống, tránh lộ cấu trúc code nội bộ ra ngoài
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;