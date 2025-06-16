const BookingDetailsModal = ({ booking, onClose, onConfirm }) => {
  if (!booking) return null;

  return (
    <div className="modal-overlay">
      <div className="booking-details-modal">
        <div className="modal-header">
          <h2>Booking Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="booking-info">
            <h3>{booking.serviceTitle}</h3>
            <p><strong>Booking ID:</strong> {booking.id}</p>
            <p><strong>Customer:</strong> {booking.customerName}</p>
            <p><strong>Date:</strong> {booking.date.toLocaleString()}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge ${booking.status.toLowerCase()}`}>
                {booking.status}
              </span>
            </p>
            <p><strong>Payment Status:</strong> 
              <span className={`payment-status ${booking.paymentStatus.toLowerCase()}`}>
                {booking.paymentStatus}
              </span>
            </p>
            <p><strong>Amount:</strong> ₹{booking.amount.toFixed(2)}</p>
            {booking.address && (
              <div className="booking-address">
                <h4>Service Address:</h4>
                <p>{booking.address.street}</p>
                <p>{booking.address.city}, {booking.address.state} {booking.address.zipCode}</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {booking.status === 'pending' && (
              <button 
                className="action-btn confirm-btn"
                onClick={() => onConfirm(booking.id)}
              >
                Confirm Booking
              </button>
            )}
            <button className="action-btn close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};