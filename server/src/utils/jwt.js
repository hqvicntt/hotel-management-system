/**
 * UTILITY JWT - Hàm tạo token xác thực
 * File này đóng vai trò là "nhà máy sản xuất thẻ thông hành"
 * Mỗi khi người dùng đăng nhập hoặc đăng ký thành công, hàm này sẽ
 * đóng gói ID và vai trò của họ vào một token JWT có chữ ký số
 */

// Nạp thư viện jsonwebtoken vào file để sử dụng các hàm mã hóa nâng cao
const jwt = require('jsonwebtoken');

/**
 * Hàm generateToken: Tạo token JWT (Hàm Sản Xuất Thẻ Thông Hành). Hàm này sẽ được gọi ở tầng Controller ngay sau khi khách hàng bấm Đăng ký hoặc Đăng nhập thành công
 * @param {string} userId - ID của user trong database
 * @param {string} role - Vai trò của user (admin/staff/customer)
 * @returns {string} - Token JWT đã được mã hóa
 * 
 * Cách hoạt động:
 * 1. Nhận vào ID và vai trò của user
 * 2. Tạo payload (phần dữ liệu) chứa thông tin cần thiết
 * 3. Dùng jwt.sign() để mã hóa payload với secret key từ .env
 * 4. Token có thời gian sống theo JWT_EXPIRE (30 ngày)
 */
const generateToken = (userId, role) => {
  // payload: gói dữ liệu sẽ được nhúng vào token. payload là phần ruột của chiếc thẻ thông hành. Khi sản xuất thẻ, chúng ta chỉ nhúng thông tin định danh tối thiểu là id của cơ sở dữ liệu và cấp bậc role của họ vào đây
  // Chỉ lưu ID và role - KHÔNG BAO GIỜ lưu mật khẩu hay thông tin nhạy cảm vì chuỗi JWT này phía Frontend có thể dùng công cụ để dịch ngược ra xem được phần ruột
  const payload = {
    id: userId,
    role: role
  };

  // Tạo token với secret key và thời gian hết hạn
  const token = jwt.sign(
    payload, 
    process.env.JWT_SECRET, // Chìa khóa mật bảo lấy từ file .env để ký số. Con dấu này giúp đảm bảo không ai có thể tự sửa đổi dữ liệu bên trong thẻ (ví dụ tự sửa role từ 'customer' thành 'admin'). Nếu họ sửa, chữ ký số sẽ lập tức bị lệch và vô hiệu hóa
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  return token;
};

/**
 * Hàm verifyToken (Hàm Kiểm Tra Thẻ Thông Hành): Xác minh token (dùng trong middleware protect)
 * @param {string} token - Token cần kiểm tra
 * @returns {object} - Payload đã giải mã
 * @throws {Error} - Nếu token không hợp lệ hoặc hết hạn
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // jwt.verify(...) (Soi kính hiển vi): Hàm này nhận vào một chiếc thẻ Token, dùng chiếc chìa khóa bí mật JWT_SECRET để giải mã và kiểm tra xem chữ ký trên thẻ có phải do chính server của mình đóng dấu hay không, thẻ có bị quá hạn 30 ngày chưa
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
  // Xử lý bẫy lỗi (try/catch): Nếu thẻ chuẩn, hàm trả về (return) phần ruột payload chứa ID và vai trò. Nếu thẻ giả mạo hoặc hết hạn, lệnh lập tức nhảy xuống catch và ném ra một lỗi thông báo cứng rắn: "Thẻ không hợp lệ hoặc đã hết hạn". Hàm này sau này sẽ được dùng để tối ưu lại file gác cổng src/middlewares/auth.js
};

module.exports = { generateToken, verifyToken };