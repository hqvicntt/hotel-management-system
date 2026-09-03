/**
 * AUTH CONTROLLER - Bộ não xử lý đăng ký và đăng nhập
 * 
 * Nhiệm vụ chính:
 * 1. Đăng ký: Nhận thông tin từ client → Kiểm tra email trùng → 
 *    Băm mật khẩu → Lưu vào database → Trả về token
 * 2. Đăng nhập: Nhận email/password → Tìm user → 
 *    So sánh mật khẩu → Tạo token → Trả về thông tin
 * 3. Lấy thông tin user hiện tại: Dùng token để lấy profile
 */

const User = require('../../models/User');
const { generateToken } = require('../../utils/jwt');

/**
 * @desc    Đăng ký tài khoản mới
 * @route   POST /api/auth/register
 * @access  Public (Ai cũng có thể đăng ký)
 * 
 * Luồng xử lý:
 * 1. Client gửi: { name, email, password, phone, role? }
 * 2. Kiểm tra email đã tồn tại chưa
 * 3. Tạo user mới (password tự động được hash trong model)
 * 4. Tạo token JWT
 * 5. Trả về: { success, token, userData }
 */
const register = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ body request
    const { name, email, password, phone, role } = req.body;

    // 2. Kiểm tra các trường bắt buộc
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, phone'
      });
    }

    // 3. Kiểm tra email đã tồn tại chưa (dùng findOne thay vì find để lấy 1 record)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use another email or login.'
      });
    }

    // 4. Tạo user mới (password sẽ được hash tự động bởi pre-save hook trong model)
    //    Nếu role không được gửi lên, mặc định là 'customer'
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer' // Nếu không có role, mặc định là customer
    });

    // 5. Tạo token JWT
    const token = generateToken(user._id, user.role);

    // 6. Trả về response thành công
    //    Không trả về password (đã có select: false trong model)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Nếu lỗi validation từ Mongoose, errorHandler sẽ bắt
    // Nhưng ta vẫn có thể xử lý thêm ở đây
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * @desc    Đăng nhập
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Luồng xử lý:
 * 1. Client gửi: { email, password }
 * 2. Tìm user theo email (bao gồm cả password)
 * 3. Nếu không tìm thấy → Báo lỗi
 * 4. So sánh password bằng bcrypt
 * 5. Nếu sai → Báo lỗi
 * 6. Nếu đúng → Tạo token → Trả về
 */
const login = async (req, res) => {
  try {
    // 1. Lấy email và password từ body
    const { email, password } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 3. Tìm user theo email - CHỦ ĐỘNG lấy cả password
    //    .select('+password') để ghi đè select: false trong model
    const user = await User.findOne({ email }).select('+password');

    // 4. Nếu không tìm thấy user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials' // Không nói cụ thể "email sai" để bảo mật
      });
    }

    // 5. Kiểm tra mật khẩu bằng phương thức comparePassword đã tạo trong model
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials' // Tương tự, không nói cụ thể "password sai"
      });
    }

    // 6. Tạo token JWT
    const token = generateToken(user._id, user.role);

    // 7. Trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin user hiện tại (dùng token)
 * @route   GET /api/auth/me
 * @access  Private (Cần token)
 * 
 * Luồng xử lý:
 * 1. Middleware protect đã gán req.user (lấy từ token)
 * 2. Trả về thông tin user
 */
const getMe = async (req, res) => {
  try {
    // req.user đã được middleware protect gán vào
    // (đã .select('-password') nên không có password)
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Đăng xuất (Client-side)
 * @route   POST /api/auth/logout
 * @access  Private
 * 
 * Note: Với JWT, logout chủ yếu được xử lý ở client
 * bằng cách xóa token khỏi localStorage.
 * Server có thể thực hiện thêm các thao tác như blacklist token
 * nhưng ở cấp độ này, ta chỉ trả về message thành công
 */
const logout = async (req, res) => {
  // JWT stateless: không cần server làm gì đặc biệt
  // Client sẽ xóa token khỏi localStorage
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};