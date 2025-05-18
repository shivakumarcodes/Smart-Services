import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import '../styles/ProviderDashboard.css';

const BookingDetailsModal = ({ booking, onClose, onConfirm, onReject }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!booking) return null;

  return (
    <div className="modal-overlay">
      <div className="booking-details-modal" ref={modalRef}>
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
            <p><strong>Amount:</strong> ${booking.amount.toFixed(2)}</p>
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
              <>
                <button 
                  className="action-btn confirm-btn"
                  onClick={() => onConfirm(booking.id)}
                >
                  Confirm Booking
                </button>
                <button 
                  className="action-btn reject-btn"
                  onClick={() => onReject(booking.id)}
                >
                  Reject Booking
                </button>
              </>
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

const ProviderDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    provider: null,
    services: [],
    bookings: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getProfilePictureUrl = () => {
    if (dashboardData.provider?.profilePicture) {
      return dashboardData.provider.profilePicture.startsWith('http')
        ? dashboardData.provider.profilePicture
        : `https://smart-services.onrender.com${dashboardData.provider.profilePicture}`;
    }
    return '/default-profile.png';
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://smart-services.onrender.com/api/provider/bookings/${bookingId}`,
        { action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Find the booking to reference in toast
      const booking = dashboardData.bookings.find(b => b.id === bookingId);
      
      // Update the local state
      setDashboardData(prev => ({
        ...prev,
        bookings: prev.bookings.map(booking => 
          booking.id === bookingId 
            ? { 
                ...booking, 
                status: action === 'confirm' ? 'confirmed' : action === 'reject' ? 'rejected' : booking.status 
              } 
            : booking
        )
      }));
      
      // Show toast notification
      if (action === 'confirm') {
        showToast(`Booking for ${booking?.serviceTitle || 'service'} has been confirmed!`, 'success');
      } else if (action === 'reject') {
        showToast(`Booking for ${booking?.serviceTitle || 'service'} has been rejected.`, 'warning');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setError(error.response?.data?.message || 'Failed to update booking.');
      showToast(`Failed to update booking: ${error.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  const handleConfirmBooking = async (bookingId) => {
    await handleBookingAction(bookingId, 'confirm');
    setShowBookingModal(false);
  };

  const handleRejectBooking = async (bookingId) => {
    await handleBookingAction(bookingId, 'reject');
    setShowBookingModal(false);
  };

  // Handle provider approval status notifications
  const checkProviderApprovalStatus = (provider) => {
    // Get the previous approval status from localStorage (if any)
    const previousStatus = localStorage.getItem('providerApprovalStatus');
    const currentStatus = provider.isApproved ? 'approved' : 'pending';
    
    // Store current status for future comparison
    localStorage.setItem('providerApprovalStatus', currentStatus);
    
    // If this is the first login, just store the status without showing notification
    if (!previousStatus) {
      return;
    }
    
    // If status changed from pending to approved
    if (previousStatus === 'pending' && currentStatus === 'approved') {
      showToast('Congratulations! Your provider account has been approved! You can now start offering services.', 'success', 8000);
    }
    
    // If status changed from approved to not approved (admin revoked approval - rare case)
    if (previousStatus === 'approved' && currentStatus === 'pending') {
      showToast('Your provider approval status has been changed. Please contact support for more information.', 'warning', 8000);
    }
  };

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('https://smart-services.onrender.com/api/provider/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const transformedData = {
          provider: {
            ...response.data.provider,
            profilePicture: response.data.provider.profilePicture || "https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg",
          },
          services: response.data.services.map(service => ({
            id: service.id,
            title: service.serviceTitle,
            description: service.description,
            category: service.serviceType,
            price: service.basePrice,
            duration: service.durationMinutes,
            isActive: service.isActive,
            image: service.imageUrl || 'https://bluetree.com.au/wp-content/uploads/2016/10/DBlue_Services.png'
          })),
          bookings: response.data.recentBookings.map(booking => ({
            id: booking.id,
            serviceId: booking.serviceId,
            customerId: booking.customerId,
            customerName: booking.customerName,
            serviceTitle: booking.serviceTitle,
            date: new Date(booking.bookingDate),
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            amount: booking.totalAmount,
            address: booking.address
          })),
          stats: response.data.stats
        };

        setDashboardData(transformedData);
        setLoading(false);
        
        // Check provider approval status
        checkProviderApprovalStatus(response.data.provider);
        
      } catch (error) {
        console.error('Error fetching provider data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard. Please try again.');
        setLoading(false);
        showToast(`Failed to load dashboard: ${error.response?.data?.message || 'Unknown error'}`, 'error');
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchProviderData();
  }, [navigate, showToast]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!dashboardData.provider) {
    return (
      <div className="not-found-container">
        <h2>Provider Not Found</h2>
        <p>We couldn't find your provider information.</p>
      </div>
    );
  }

  return (
    <div className="provider-dashboard">
      <div className="dashboard-content">
        <div className="provider-info-card">
          <div className="profile-section">
            <img 
              src={getProfilePictureUrl()} 
              alt="Profile" 
              className="profile-image"
              onError={(e) => {
                e.target.src = 'https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg';
              }}
            />
            <div className="profile-details">
              <h3>{dashboardData.provider.name}</h3>
              <p><strong>Email:</strong> {dashboardData.provider.email}</p>
              <p><strong>Phone:</strong> {dashboardData.provider.phone || 'Not provided'}</p>
              <p><strong>Service Type:</strong> {dashboardData.provider.serviceType}</p>
              <span className={`approval-status ${dashboardData.provider.isApproved ? 'approved' : 'pending'}`}>
                {dashboardData.provider.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
          </div>
        </div>

        <section className="bookings-section">
          <div className="section-header">
            <h2>Recent Bookings</h2>
            <button 
              className="view-all-btn"
              // onClick={() => navigate('/provider/bookings')}
            >
              View All
            </button>
          </div>

          {dashboardData.bookings.length > 0 ? (
            <div className="bookings-list">
              {dashboardData.bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.serviceTitle}</h3>
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-details">
                    <p><strong>Customer:</strong> {booking.customerName}</p>
                    <p><strong>Date:</strong> {booking.date.toLocaleString()}</p>
                    <p><strong>Amount:</strong> ${booking.amount.toFixed(2)}</p>
                    <p><strong>Payment:</strong> 
                      <span className={`payment-status ${booking.paymentStatus.toLowerCase()}`}>
                        {booking.paymentStatus}
                      </span>
                    </p>
                  </div>
                  <div className="booking-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          className="action-btn confirm-btn"
                          onClick={() => handleBookingAction(booking.id, 'confirm')}
                        >
                          Confirm
                        </button>
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => handleBookingAction(booking.id, 'cancel')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-bookings">
              <p>You don't have any bookings yet.</p>
            </div>
          )}
        </section>

        <section className="services-section">
          <div className="section-header">
            <h2>Your Services</h2>
            <button 
              className="add-service-btn"
              onClick={() => navigate('/provider/services/new')}
            >
              + Add New Service
            </button>
          </div>

          <div className="services-grid">
            {dashboardData.services.length > 0 ? (
              dashboardData.services.map(service => (
                <div key={service.id} className="service-card">
                  <div className="service-image-container">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      onError={(e) => {
                        e.target.src = 'https://bluetree.com.au/wp-content/uploads/2016/10/DBlue_Services.png';
                      }}
                    />
                  </div>
                  <div className="service-info">
                    <h3>{service.title}</h3>
                    <p className="service-description">{service.description}</p>
                    <div className="service-meta">
                      <span>${service.price.toFixed(2)}</span>
                      <span>{service.duration} mins</span>
                      <span className={`status ${service.isActive ? 'active' : 'inactive'}`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-services">
                <p>You haven't added any services yet.</p>
                <button 
                  className="add-service-btn"
                  onClick={() => navigate('/provider/services/new')}
                >
                  Create Your First Service
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {showBookingModal && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={handleCloseModal}
          onConfirm={handleConfirmBooking}
          onReject={handleRejectBooking}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;