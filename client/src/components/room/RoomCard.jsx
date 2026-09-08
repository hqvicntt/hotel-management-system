/**
 * RoomCard.jsx - Component hiển thị một căn phòng dưới dạng Card
 * 
 * Props:
 * - room: Object chứa thông tin phòng
 * - onBook: Callback khi bấm nút đặt phòng
 * - showActions: Boolean hiển thị các action (Admin)
 * - onEdit: Callback khi bấm sửa (Admin)
 * - onDelete: Callback khi bấm xóa (Admin)
 */

import { formatPrice, getAmenityIcon } from '@services/roomService'

// Màu sắc cho từng loại phòng
const typeColors = {
  'Single': 'primary',
  'Double': 'success',
  'Suite': 'warning',
  'Deluxe': 'danger'
}

// Icon cho từng loại phòng
const typeIcons = {
  'Single': 'bi-person',
  'Double': 'bi-people',
  'Suite': 'bi-star',
  'Deluxe': 'bi-gem'
}

// Màu sắc cho trạng thái phòng
const statusColors = {
  'Available': 'success',
  'Booked': 'danger',
  'Maintenance': 'warning',
  'Cleaning': 'info'
}

// Text hiển thị cho trạng thái
const statusLabels = {
  'Available': 'Còn trống',
  'Booked': 'Đã đặt',
  'Maintenance': 'Bảo trì',
  'Cleaning': 'Đang dọn'
}

const RoomCard = ({ 
  room, 
  onBook, 
  showActions = false, 
  onEdit, 
  onDelete 
}) => {
  // Hàm xử lý ảnh mặc định nếu không có ảnh
  const getDefaultImage = (type) => {
    const imageMap = {
      'Single': 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=400&h=300&fit=crop',
      'Double': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
      'Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      'Deluxe': 'https://images.unsplash.com/photo-1587985064135-0366536eab42?w=400&h=300&fit=crop'
    }
    return imageMap[type] || imageMap['Double']
  }

  const mainImage = room.images?.[0] || getDefaultImage(room.type)
  const typeColor = typeColors[room.type] || 'secondary'
  const typeIcon = typeIcons[room.type] || 'bi-building'
  const statusColor = statusColors[room.status] || 'secondary'
  const statusLabel = statusLabels[room.status] || room.status

  // Lấy 4 tiện ích đầu tiên để hiển thị
  const displayAmenities = room.amenities?.slice(0, 4) || []
  const hasMoreAmenities = (room.amenities?.length || 0) > 4

  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm border-0 hover-shadow transition-all fade-in">
        
        {/* ==========================================
            IMAGE
            ========================================== */}
        <div className="position-relative">
          <img
            src={mainImage}
            alt={`Phòng ${room.roomNumber}`}
            className="card-img-top"
            style={{ height: '220px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = 'https://placehold.co/600x400/e9ecef/495057?text=No+Image'
            }}
          />
          
          {/* Status Badge */}
          <span className={`position-absolute top-0 end-0 m-2 badge bg-${statusColor} px-3 py-2`}>
            <i className={`bi ${room.status === 'Available' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
            {statusLabel}
          </span>
          
          {/* Type Badge */}
          <span className={`position-absolute top-0 start-0 m-2 badge bg-${typeColor} px-3 py-2`}>
            <i className={`bi ${typeIcon} me-1`}></i>
            {room.type}
          </span>
        </div>

        {/* ==========================================
            BODY
            ========================================== */}
        <div className="card-body d-flex flex-column">
          
          {/* Room Number & Price */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="card-title mb-0 fw-bold">
                Phòng {room.roomNumber}
              </h5>
              <small className="text-muted">
                <i className="bi bi-people me-1"></i>
                {room.maxOccupants} người
                {room.floor && (
                  <>
                    <span className="mx-1">•</span>
                    <i className="bi bi-layers me-1"></i>
                    Tầng {room.floor}
                  </>
                )}
              </small>
            </div>
            <div className="text-end">
              <span className="text-primary fw-bold fs-5">
                {formatPrice(room.pricePerNight)}
              </span>
              <div className="text-muted small">/đêm</div>
            </div>
          </div>

          {/* Description */}
          {room.description && (
            <p className="card-text text-muted small mb-3">
              {room.description.length > 80 
                ? room.description.substring(0, 80) + '...' 
                : room.description}
            </p>
          )}

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-1">
                {displayAmenities.map((amenity, index) => (
                  <span 
                    key={index} 
                    className="badge bg-light text-dark border px-2 py-1"
                    title={amenity}
                  >
                    <i className={`${getAmenityIcon(amenity)} me-1`}></i>
                    {amenity.length > 10 ? amenity.substring(0, 10) + '…' : amenity}
                  </span>
                ))}
                {hasMoreAmenities && (
                  <span className="badge bg-light text-muted border px-2 py-1">
                    +{room.amenities.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              ACTIONS
              ========================================== */}
          <div className="mt-auto d-flex gap-2">
            {/* Book Button - Chỉ hiển thị khi phòng trống */}
            {room.status === 'Available' && (
              <button
                className="btn btn-primary w-100"
                onClick={() => onBook?.(room)}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Đặt phòng ngay
              </button>
            )}
            
            {room.status !== 'Available' && (
              <button
                className="btn btn-secondary w-100"
                disabled
              >
                <i className="bi bi-clock me-2"></i>
                {room.status === 'Booked' ? 'Đã được đặt' : 'Tạm thời đóng'}
              </button>
            )}

            {/* Admin Actions */}
            {showActions && (
              <div className="btn-group">
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={() => onEdit?.(room)}
                  title="Sửa phòng"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => onDelete?.(room)}
                  title="Xóa phòng"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomCard