/**
 * LoadingSpinner.jsx - Component hiển thị trạng thái loading
 */

const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner