import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import '../styles/Booking.css';

const Booking = ({
  service,
  bookingDate,
  setBookingDate,
  specialRequests,
  setSpecialRequests,
  address,
  setAddress,
  isBooking,
  handleBookingSubmit,
  setShowBookingForm,
  bookingSuccess,
  bookingError,
}) => {
  // Function to calculate minimum date/time (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };
  // Fetch user data to pre-fill address if it's not already set
  useEffect(() => {
    const fetchUserAddress = async () => {
      // Only try to fetch if address is empty
      if (!address.trim()) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const response = await fetch('https://smart-services.onrender.com/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.address) {
              setAddress(userData.address);
            }
          }
        } catch (err) {
          console.error('Error fetching user address:', err);
        }
      }
    };
    
    fetchUserAddress();
  }, [address, setAddress]);

  return ReactDOM.createPortal(
    <div className="booking-overlay" onClick={() => setShowBookingForm(false)}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setShowBookingForm(false)}>×</button>
        
        <div className="booking-modal-header">
          <h3>Book This Service</h3>
        </div>
        
        {bookingSuccess ? (
          <div className="booking-success">
            <p>✓ Booking successful! Redirecting to your bookings...</p>
          </div>
        ) : (
          <>
            <div className="service-summary">
              <img
                src="https://placehold.co/400x300.png?text=Service+Image&font=roboto" 
                alt={service.title} 
                className="service-thumbnail"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '/default-service.jpg';
                }}
              />
              <div className="service-info">
                <h4>{service.title}</h4>
                <div className="service-details">
                  <p className="provider-name">By {service.provider_name}</p>
                  <p className="service-price">₹{service.base_price}</p>
                  <p className="service-duration">{service.duration_minutes} mins</p>
                </div>
              </div>
            </div>
          
            {bookingError && <div className="error-message">{bookingError}</div>}
            
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label htmlFor="booking-date">Date & Time*</label>
                <input
                  id="booking-date"
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getMinDateTime()}
                  required
                />
                <small>Please select a date and time for your service</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="service-address">Service Address*</label>
                <input
                  id="service-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Where should the service be performed?"
                  required
                />
                <small>Provide the complete address where you need this service</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="special-requests">Special Requests</label>
                <textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special instructions for the provider"
                  rows={4}
                />
                <small>Optional: Provide any specific requirements or details</small>
              </div>
              
              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-row">
                  <span>Service Fee:</span>
                  <span>₹{service.base_price}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{service.base_price}</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="confirm-btn"
                >
                  {isBooking ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.getElementById('portal-root')
  );
};

export default Booking;