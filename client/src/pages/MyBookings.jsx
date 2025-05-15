import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import '../styles/MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevBookingsRef = useRef([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const newBookings = response.data;

        // Check for status changes
        prevBookingsRef.current.forEach((prevBooking) => {
          const updated = newBookings.find((b) => b.booking_id === prevBooking.booking_id);
          if (updated && updated.status !== prevBooking.status) {
            const { service_title, status } = updated;
            if (status === 'confirmed') {
              showToast(`Your booking for ${service_title} has been confirmed!`, 'success');
            } else if (status === 'rejected') {
              showToast(`Your booking for ${service_title} has been rejected.`, 'error');
            } else if (status === 'completed') {
              showToast(`Your booking for ${service_title} has been completed.`, 'info');
            }
          }
        });

        setBookings(newBookings);
        prevBookingsRef.current = newBookings;

        // Handle toast from URL params
        const params = new URLSearchParams(window.location.search);
        const bookingStatus = params.get('status');
        const bookingId = params.get('bookingId');
        if (bookingStatus && bookingId) {
          const booking = newBookings.find((b) => b.booking_id === bookingId);
          if (booking) {
            if (bookingStatus === 'confirmed') {
              showToast(`Your booking for ${booking.service_title} has been confirmed!`, 'success');
            } else if (bookingStatus === 'rejected') {
              showToast(`Your booking for ${booking.service_title} has been rejected.`, 'error');
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        showToast(`Error loading bookings: ${msg}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate, showToast]);

  const handleCancelBooking = async (bookingId) => {
  if (!window.confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Add token validation check
    const decodedToken = jwtDecode(token); // You'll need jwt-decode package
    if (!decodedToken || !decodedToken.user_id) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    const response = await axios.put(
      `http://localhost:5000/api/bookings/${bookingId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      }
    );

    if (response.status === 200) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.booking_id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
      showToast('Booking has been cancelled successfully.', 'warning');
    } else if (response.status === 403) {
      showToast('You are not authorized to cancel this booking.', 'error');
    } else {
      throw new Error(response.data?.message || 'Failed to cancel booking');
    }
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      const errorMsg = err.response?.data?.message || err.message;
      showToast(`Failed to cancel booking: ${errorMsg}`, 'error');
      console.error('Cancel booking error:', err);
    }
  }
};

  if (loading) return <div className="loading">Loading your bookings...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="my-bookings-container">
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You don't have any bookings yet.</p>
          <button onClick={() => navigate('/services')}>Browse Services</button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.booking_id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.service_title}</h3>
                <span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span>
              </div>
              <div className="booking-details">
                <p><strong>Provider:</strong> {booking.provider_name}</p>
                <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleString()}</p>
                <p><strong>Amount:</strong> ${Number(booking.total_amount || 0).toFixed(2)}</p>
                {booking.payment_status && (
                  <p><strong>Payment:</strong> 
                    <span className={`payment-status ${booking.payment_status.toLowerCase()}`}>
                      {booking.payment_status}
                    </span>
                  </p>
                )}
                {booking.special_requests && (
                  <p><strong>Special Requests:</strong> {booking.special_requests}</p>
                )}
              </div>
              <div className="booking-actions">
                {booking.status === 'pending' && (
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => handleCancelBooking(booking.booking_id)}
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  className="action-btn view-btn"
                  onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
