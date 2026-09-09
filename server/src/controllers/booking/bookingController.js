/**
 * bookingController.js - Controller xử lý đặt phòng
 * 
 * Các chức năng:
 * 1. Customer: Tạo booking mới, xem lịch sử của mình
 * 2. Admin: Xem tất cả booking, cập nhật trạng thái
 * 
 * Luồng tạo booking:
 * 1. Kiểm tra phòng có trống trong khoảng ngày không
 * 2. Tính totalAmount = số đêm * pricePerNight
 * 3. Tạo booking với status 'Pending'
 * 4. Cập nhật trạng thái phòng thành 'Booked'
 * 5. Trả về thông tin booking
 */

const Booking = require('../../models/Booking');
const Room = require('../../models/Room');
const User = require('../../models/User');

// ============================================
// 1. CUSTOMER METHODS
// ============================================

/**
 * @desc    Tạo đơn đặt phòng mới (Customer)
 * @route   POST /api/bookings
 * @access  Private (Customer, Staff, Admin)
 * 
 * Body: {
 *   roomId,
 *   checkInDate,
 *   checkOutDate,
 *   guestCount,
 *   specialRequests
 * }
 */
const createBooking = async (req, res) => {
  try {
    const { 
      roomId, 
      checkInDate, 
      checkOutDate, 
      guestCount, 
      specialRequests 
    } = req.body;

    // 1. Kiểm tra dữ liệu bắt buộc
    if (!roomId || !checkInDate || !checkOutDate || !guestCount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: roomId, checkInDate, checkOutDate, guestCount'
      });
    }

    // 2. Lấy thông tin phòng
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng với ID này'
      });
    }

    // 3. Kiểm tra phòng có trống không
    if (room.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Phòng hiện đang ${room.status === 'Booked' ? 'đã được đặt' : 'không khả dụng'}`
      });
    }

    // 4. Kiểm tra số lượng khách
    if (guestCount > room.maxOccupants) {
      return res.status(400).json({
        success: false,
        message: `Số lượng khách (${guestCount}) vượt quá sức chứa tối đa (${room.maxOccupants})`
      });
    }

    // 5. Kiểm tra phòng còn trống trong khoảng ngày
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // ==========================================
    // BỘ LỌC PHÒNG NGỰ NGÀY THÁNG ĐẦU VÀO
    // ==========================================
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Ngày trả phòng phải sau ngày nhận phòng'
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (checkIn < now) {
      return res.status(400).json({
        success: false,
        message: 'Ngày nhận phòng không được ở quá khứ'
      });
    }
    
    const isAvailable = await Booking.isRoomAvailable(roomId, checkIn, checkOut);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Phòng đã được đặt trong khoảng thời gian này'
      });
    }

    // 6. Tính tổng tiền
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số đêm phải lớn hơn 0'
      });
    }
    const totalAmount = nights * room.pricePerNight;

    // Tự sinh mã đơn hàng trực tiếp tại đây bằng hàm static của Model
    const bookingCode = Booking.generateBookingCode();

    // 7. Tạo booking
    const booking = await Booking.create({
      bookingCode,
      customerId: req.user._id,
      roomId: room._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmount,
      guestCount,
      specialRequests: specialRequests || '',
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    });

    // 8. Cập nhật trạng thái phòng thành 'Booked'
    await Room.findByIdAndUpdate(roomId, { status: 'Booked' });

    // 9. Populate thông tin room và customer để trả về
    const populatedBooking = await Booking.findById(booking._id)
      .populate('roomId', 'roomNumber type pricePerNight images')
      .populate('customerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công! Mã đặt phòng: ' + booking.bookingCode,
      data: populatedBooking
    });

  } catch (error) {
    console.error('❌ Create booking error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn đặt phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy lịch sử đặt phòng của khách hàng hiện tại
 * @route   GET /api/bookings/my-bookings
 * @access  Private (Customer, Staff, Admin)
 * 
 * Query params: status (lọc theo trạng thái)
 */
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    const bookings = await Booking.getUserBookings(req.user._id, { status });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('❌ Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đặt phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy chi tiết một booking (kiểm tra quyền)
 * @route   GET /api/bookings/:id
 * @access  Private (Customer chỉ xem được của mình, Admin xem được tất cả)
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('roomId', 'roomNumber type pricePerNight images description maxOccupants')
      .populate('customerId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt phòng với ID này'
      });
    }

    // Kiểm tra quyền: Customer chỉ xem được booking của mình
    const isAdmin = req.user.role === 'admin';
    const isStaff = req.user.role === 'staff';
    const isOwner = booking.customerId._id.toString() === req.user._id.toString();

    if (!isAdmin && !isStaff && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn đặt phòng này'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('❌ Get booking by id error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID đơn đặt phòng không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn đặt phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Hủy đơn đặt phòng (Customer)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Customer)
 * 
 * Body: { reason }
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 1. Tìm booking
    const booking = await Booking.findById(id)
      .populate('roomId', 'roomNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt phòng với ID này'
      });
    }

    // 2. Kiểm tra quyền sở hữu
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn đặt phòng này'
      });
    }

    // 3. Kiểm tra có thể hủy không
    if (!booking.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn đặt phòng ở trạng thái này'
      });
    }

    // 4. Hủy booking
    await booking.cancel(reason || 'Khách hàng hủy đơn');

    // 5. Cập nhật trạng thái phòng nếu booking bị hủy
    await Room.findByIdAndUpdate(booking.roomId._id, { status: 'Available' });

    res.status(200).json({
      success: true,
      message: 'Hủy đơn đặt phòng thành công',
      data: booking
    });

  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn đặt phòng',
      error: error.message
    });
  }
};

// ============================================
// 2. ADMIN METHODS
// ============================================

/**
 * @desc    Lấy tất cả đơn đặt phòng (Admin)
 * @route   GET /api/bookings/admin/all
 * @access  Private (Admin)
 * 
 * Query params: 
 * - status: lọc theo trạng thái
 * - limit, page: phân trang
 * - sort: sắp xếp
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, limit = 20, page = 1, sort = '-createdAt' } = req.query;

    // Xây dựng filter
    const filter = {};
    if (status) filter.status = status;

    // Tính toán phân trang
    const skip = (Number(page) - 1) * Number(limit);

    // Thực hiện query
    const bookings = await Booking.find(filter)
      .populate('roomId', 'roomNumber type pricePerNight images')
      .populate('customerId', 'name email phone')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    // Đếm tổng
    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: bookings
    });

  } catch (error) {
    console.error('❌ Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn đặt phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật trạng thái đơn đặt (Admin)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Admin)
 * 
 * Body: { status }
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Kiểm tra status hợp lệ
    const validStatuses = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`
      });
    }

    // 2. Tìm booking
    const booking = await Booking.findById(id)
      .populate('roomId', 'roomNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt phòng với ID này'
      });
    }

    // 3. Xử lý logic theo trạng thái
    const oldStatus = booking.status;

    // Nếu chuyển sang Cancelled, cập nhật phòng thành Available
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      await Room.findByIdAndUpdate(booking.roomId._id, { status: 'Available' });
    }

    // Nếu chuyển từ Cancelled sang trạng thái khác, cập nhật phòng thành Booked
    if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      await Room.findByIdAndUpdate(booking.roomId._id, { status: 'Booked' });
    }

    // Nếu chuyển sang CheckedIn, cập nhật phòng thành Booked (nếu chưa)
    if (status === 'CheckedIn') {
      await Room.findByIdAndUpdate(booking.roomId._id, { status: 'Booked' });
    }

    // Nếu chuyển sang CheckedOut, cập nhật phòng thành Available
    if (status === 'CheckedOut') {
      await Room.findByIdAndUpdate(booking.roomId._id, { status: 'Available' });
    }

    // 4. Cập nhật status
    await booking.updateStatus(status);

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn đặt thành công: ${status}`,
      data: booking
    });

  } catch (error) {
    console.error('❌ Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn đặt',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật trạng thái thanh toán (Admin)
 * @route   PUT /api/bookings/:id/payment
 * @access  Private (Admin)
 * 
 * Body: { paymentStatus: 'Paid' | 'Refunded' }
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ['Unpaid', 'Paid', 'Refunded'];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái thanh toán không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt phòng với ID này'
      });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái thanh toán thành công: ${paymentStatus}`,
      data: booking
    });

  } catch (error) {
    console.error('❌ Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};

// ============================================
// 3. EXPORT
// ============================================

module.exports = {
  // Customer
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  
  // Admin
  getAllBookings,
  updateBookingStatus,
  updatePaymentStatus
};