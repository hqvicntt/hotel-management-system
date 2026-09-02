const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hàm protect (Xác thực đăng nhập bằng mã Token JWT) dùng để bảo vệ các tuyến đường (route) riêng tư, ví dụ: Chỉ ai đăng nhập rồi mới được bấm "Đặt phòng" hoặc "Xem lịch sử đặt phòng"
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) { // Khi Frontend (ReactJS) gửi một yêu cầu cần xác thực, nó sẽ đính kèm mã token vào trong phần Header của gói tin dưới dạng một chuỗi: Bearer eyJhbGciOi.... Dòng này dùng để kiểm tra xem Frontend có gửi cái "thẻ thông hành" này lên không
    try {
      // Dùng lệnh split(' ') để cắt chuỗi tại khoảng trắng, loại bỏ chữ Bearer ở đầu để lấy ra chính xác đoạn mã bí ẩn nằm ở phía sau (vị trí số 1 trong mảng)
      token = req.headers.authorization.split(' ')[1];

      // Verify token: Lấy chìa khóa bí mật từ file .env ra để giải mã mã token. Nếu token bị giả mạo hoặc hết hạn, lệnh này sẽ ném lỗi thẳng xuống khối catch. Nếu đúng, nó giải mã ra được thông tin ID của User nằm bên trong (decoded.id)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Cầm ID vừa giải mã được chạy xuống MongoDB để bốc toàn bộ thông tin của User đó lên. Dòng .select('-password') một lần nữa khẳng định sự cẩn thận: bốc thông tin nhưng chủ động bỏ lại mật khẩu, không thèm lấy mật khẩu lên. Sau đó đính kèm thông tin User này vào biến req.user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next(); // Nếu mọi thứ hoàn hảo (tìm thấy User, token chuẩn), lệnh next() ra hiệu cho NodeJS: "Thẻ thông hành hợp lệ, cho phép yêu cầu này đi tiếp vào trong để xử lý tính năng!"
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
  // Các khối trả về res.status(401): Nếu không gửi token hoặc token sai/lỗi, người gác cổng lập tức chặn đứng lại và trả về mã lỗi 401 (Unauthorized - Không có quyền truy cập) kèm thông báo đuổi khách ra
};

// Hàm phân quyền truy cập theo chức năng
// Sau khi hàm protect xác nhận bạn đã đăng nhập thành công, hàm authorize sẽ tiếp tục kiểm tra xem cấp bậc (role) của bạn có đủ tuổi để vào khu vực đó không. Ví dụ: Chỉ có admin mới được vào trang CRUD phòng để xóa một căn phòng, khách hàng (customer) không được phép làm điều đó
const authorize = (...roles) => { // ...roles (Kỹ thuật Rest Parameter): Cho phép bạn truyền vào danh sách các quyền được phép truy cập dưới dạng một mảng (Ví dụ sau này bạn gọi hàm ở file Route là: authorize('admin', 'staff'))
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) { // roles.includes(req.user.role): Kiểm tra xem cái vai trò của người đang truy cập (req.user.role vừa lấy được từ hàm protect ở trên) có nằm trong danh sách các quyền được cho phép hay không
      return res.status(403).json({ // res.status(403): Nếu bạn là customer mà cố tình đòi gọi API xóa phòng của Admin, hàm này lập tức chặn lại và trả về mã lỗi 403 (Forbidden - Bị cấm truy cập). Nếu quyền hợp lệ, nó lại gọi next() để cho đi tiếp
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
// Tóm lại, file "src/middlewares/auth.js" dùng để Xác thực danh tính (Authentication) và Phân quyền người dùng (Authorization) (Nói 1 cách dễ hiểu thì file "src/middlewares/auth.js" là người gác cổng, có nhiệm vụ "kiểm tra thẻ thông hành" và "soi cấp bậc")