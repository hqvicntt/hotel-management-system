/**
 * roomController.js - Controller xử lý các tác vụ liên quan đến phòng
 * 
 * Các chức năng:
 * 1. Public: Lấy danh sách phòng, xem chi tiết phòng
 * 2. Admin: Thêm, sửa, xóa phòng
 * 
 * Phân quyền:
 * - GET /api/rooms: Ai cũng xem được
 * - GET /api/rooms/:id: Ai cũng xem được
 * - POST /api/rooms: Cần admin
 * - PUT /api/rooms/:id: Cần admin
 * - DELETE /api/rooms/:id: Cần admin
 */

const Room = require('../../models/Room');

// ============================================
// 1. PUBLIC METHODS (Không cần xác thực)
// ============================================

/**
 * @desc    Lấy danh sách tất cả phòng (có hỗ trợ lọc)
 * @route   GET /api/rooms
 * @access  Public
 * 
 * Query params:
 * - type: Lọc theo loại phòng (Single, Double, Suite, Deluxe)
 * - status: Lọc theo trạng thái (Available, Booked, Maintenance)
 * - minPrice: Giá tối thiểu
 * - maxPrice: Giá tối đa
 * - limit: Số lượng kết quả (mặc định 20)
 * - page: Trang số (mặc định 1)
 * - sort: Sắp xếp (price, createdAt)
 */
const getRooms = async (req, res) => {
  try {
    // 1. Xây dựng query filter
    const { type, status, minPrice, maxPrice, limit = 20, page = 1, sort = 'createdAt' } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    // 2. Xây dựng sort options
    const sortOptions = {};
    if (sort === 'price') sortOptions.pricePerNight = 1;
    else if (sort === '-price') sortOptions.pricePerNight = -1;
    else sortOptions.createdAt = -1;

    // 3. Tính toán phân trang
    const skip = (Number(page) - 1) * Number(limit);

    // 4. Thực hiện query
    const rooms = await Room.find(filter)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);

    // 5. Đếm tổng số kết quả
    const total = await Room.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: rooms.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: rooms
    });

  } catch (error) {
    console.error('❌ Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy chi tiết một phòng theo ID
 * @route   GET /api/rooms/:id
 * @access  Public
 */
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng với ID này'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });

  } catch (error) {
    console.error('❌ Get room by id error:', error);
    
    // Xử lý lỗi CastError (ID không đúng định dạng)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID phòng không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách phòng trống (có sẵn để đặt)
 * @route   GET /api/rooms/available
 * @access  Public
 * 
 * Query params: type, minPrice, maxPrice
 */
const getAvailableRooms = async (req, res) => {
  try {
    const { type, minPrice, maxPrice } = req.query;
    
    const filters = { type, minPrice, maxPrice };
    // Loại bỏ undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const rooms = await Room.getAvailableRooms(filters);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });

  } catch (error) {
    console.error('❌ Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng trống',
      error: error.message
    });
  }
};

// ============================================
// 2. ADMIN METHODS (Cần xác thực + phân quyền)
// ============================================

/**
 * @desc    Tạo phòng mới (Chỉ Admin)
 * @route   POST /api/rooms
 * @access  Private (Admin)
 * 
 * Body: { roomNumber, type, pricePerNight, maxOccupants, status, description, images, amenities, floor }
 */
const createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      type,
      pricePerNight,
      maxOccupants,
      status = 'Available',
      description,
      images,
      amenities,
      floor
    } = req.body;

    // 1. Kiểm tra dữ liệu bắt buộc
    if (!roomNumber || !type || !pricePerNight || !maxOccupants) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: roomNumber, type, pricePerNight, maxOccupants'
      });
    }

    // 2. Kiểm tra số phòng đã tồn tại chưa
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Số phòng ${roomNumber} đã tồn tại trong hệ thống`
      });
    }

    // 3. Tạo phòng mới
    const room = await Room.create({
      roomNumber,
      type,
      pricePerNight,
      maxOccupants,
      status,
      description: description || '',
      images: images || [],
      amenities: amenities || [],
      floor: floor || 1
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phòng mới thành công',
      data: room
    });

  } catch (error) {
    console.error('❌ Create room error:', error);
    
    // Xử lý lỗi validation
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
      message: 'Lỗi khi tạo phòng mới',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật thông tin phòng (Chỉ Admin)
 * @route   PUT /api/rooms/:id
 * @access  Private (Admin)
 */
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Tìm phòng cần cập nhật
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng với ID này'
      });
    }

    // 2. Nếu cập nhật số phòng, kiểm tra trùng
    if (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ 
        roomNumber: updateData.roomNumber 
      });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: `Số phòng ${updateData.roomNumber} đã tồn tại`
        });
      }
    }

    // 3. Cập nhật phòng
    // Sử dụng findByIdAndUpdate với option new: true để trả về document đã cập nhật
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Trả về document mới
        runValidators: true // Chạy validation của schema
      }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: updatedRoom
    });

  } catch (error) {
    console.error('❌ Update room error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID phòng không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa phòng (Chỉ Admin)
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin)
 * 
 * Lưu ý: Chỉ xóa được khi phòng không có đơn đặt hoạt động
 * (đã được kiểm tra trong middleware pre 'deleteOne')
 */
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm phòng cần xóa
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng với ID này'
      });
    }

    // 2. Kiểm tra xem phòng có đơn đặt hoạt động không
    const Booking = require('../../models/Booking');
    const activeBooking = await Booking.findOne({
      roomId: id,
      status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phòng đang có đơn đặt hoạt động'
      });
    }

    // 3. Xóa phòng
    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa phòng thành công',
      data: { id: room._id, roomNumber: room.roomNumber }
    });

  } catch (error) {
    console.error('❌ Delete room error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID phòng không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật trạng thái phòng (Chỉ Admin)
 * @route   PATCH /api/rooms/:id/status
 * @access  Private (Admin)
 * 
 * Body: { status: 'Available' | 'Booked' | 'Maintenance' | 'Cleaning' }
 */
const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Kiểm tra status hợp lệ
    const validStatuses = ['Available', 'Booked', 'Maintenance', 'Cleaning'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`
      });
    }

    // 2. Tìm phòng
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng với ID này'
      });
    }

    // 3. Cập nhật status
    await room.updateStatus(status);

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái phòng thành công: ${status}`,
      data: room
    });

  } catch (error) {
    console.error('❌ Update room status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái phòng',
      error: error.message
    });
  }
};

// ============================================
// 3. EXPORT
// ============================================

module.exports = {
  // Public
  getRooms,
  getRoomById,
  getAvailableRooms,
  
  // Admin
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus
};