import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profilePicture: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to access your profile', 'warning');
        navigate('/login');
        return;
      }

      const response = await axios.get('https://smart-services.onrender.com/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile(response.data);
      setFormData({
        name: response.data.name,
        phone: response.data.phone || '',
        profilePicture: null
      });
      
      // Check provider approval status if applicable
      if (response.data.role === 'provider' && response.data.provider) {
        checkProviderApprovalStatus(response.data.provider);
      }
      
      showToast('Profile loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load profile. Please try again later.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again', 'warning');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle provider approval status notifications
  const checkProviderApprovalStatus = (provider) => {
    // Get the previous approval status from localStorage (if any)
    const previousStatus = localStorage.getItem('providerApprovalStatus');
    const currentStatus = provider.is_approved ? 'approved' : 'pending';
    
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to update your profile', 'warning');
        navigate('/login');
        return;
      }
      
      const formDataToSend = new FormData();
      
      // Only append fields that have changed
      if (formData.name !== profile.name) {
        formDataToSend.append('name', formData.name);
      }
      
      // Phone can be empty string to clear it
      if (formData.phone !== profile.phone) {
        formDataToSend.append('phone', formData.phone);
      }
      
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }
      
      // Check if we have anything to update
      if (formDataToSend.entries().next().done) {
        setIsEditing(false);
        setPreviewImage(null);
        showToast('No changes were made', 'info');
        return;
      }
      
      const response = await axios.put('https://smart-services.onrender.com/api/profile', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update profile with the returned data
      setProfile(response.data);
      setIsEditing(false);
      setPreviewImage(null);
      
      // Reset form data with new values
      setFormData({
        name: response.data.name,
        phone: response.data.phone || '',
        profilePicture: null
      });
      
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again later.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => {
    if (!name || typeof name !== 'string') return '';
    const trimmedName = name.trim();
    return trimmedName.length > 0 ? trimmedName.charAt(0).toUpperCase() : '';
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString || 'Unknown date';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Helper function to get full URL for profile picture
  const getProfilePictureUrl = (url) => {
    if (!url) return null;
    // If the URL already starts with http or https, return it as is
    if (url.startsWith('http')) return url;
    // Otherwise, prepend the base API URL
    return `https://smart-services.onrender.com${url}`;
  };

  if (loading && !profile) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchProfile} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="not-found-container">
        <h2>Profile Not Found</h2>
        <p>We couldn't find your profile information.</p>
        <button onClick={() => navigate('/login')} className="login-button">Go to Login</button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="profile-container">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Phone</label>
            <input 
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Profile Picture</label>
            <div className="image-upload-container">
              {(previewImage || profile.profilePicture) && (
                <img 
                  src={previewImage || getProfilePictureUrl(profile.profilePicture)} 
                  alt="Profile preview" 
                  className="profile-preview"
                />
              )}
              <input 
                type="file"
                name="profilePicture"
                onChange={handleFileChange}
                accept="image/*"
                disabled={loading}
              />
            </div>
          </div>
          
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => {
                setIsEditing(false);
                setPreviewImage(null);
                // Reset form data to current profile values
                setFormData({
                  name: profile.name,
                  phone: profile.phone || '',
                  profilePicture: null
                });
                showToast('Editing cancelled', 'info');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        {profile.profilePicture ? (
          <img
            src={getProfilePictureUrl(profile.profilePicture)}
            alt={profile.name}
            className="profile-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `<div class="profile-avatar-initial">${getInitial(profile.name)}</div>`;
            }}
          />
        ) : (
          <div className="profile-avatar-initial">
            {getInitial(profile.name)}
          </div>
        )}
        <h1>{profile.name}</h1>
        <p className="user-email">{profile.email}</p>
        {profile.phone && <p className="user-phone">{profile.phone}</p>}
        <div className="user-status">
          <span className={`role-badge ${profile.role}`}>{profile.role}</span>
          {profile.isVerified && <span className="verified-badge">Verified</span>}
        </div>
      </div>

      {profile.role === 'provider' && profile.provider && (
        <div className="provider-info">
          <h2>Provider Information</h2>
          <div className="provider-details">
            <p><strong>Service Type:</strong> {profile.provider.service_type || 'Not specified'}</p>
            <p><strong>Experience:</strong> {profile.provider.experience_years || 0} years</p>
            <p><strong>Rating:</strong> {profile.provider.rating ? `${profile.provider.rating}/5` : 'No ratings yet'}</p>
            <p><strong>Status:</strong> {profile.provider.is_approved ? 'Approved' : 'Pending Approval'}</p>
            {profile.provider.description && (
              <div className="provider-description">
                <h3>About</h3>
                <p>{profile.provider.description}</p>
              </div>
            )}
          </div>

          {profile.provider.services && profile.provider.services.length > 0 && (
            <div className="provider-services">
              <h3>My Services</h3>
              <div className="services-grid">
                {profile.provider.services.map(service => (
                  <div key={service.service_id} className="service-card">
                    {service.primary_image_url && (
                      <img 
                        src={getProfilePictureUrl(service.primary_image_url)} 
                        alt={service.title}
                        className="service-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <h4>{service.title}</h4>
                    <p className="service-category">{service.category}</p>
                    <p className="service-price">${service.base_price?.toFixed(2) || '0.00'}</p>
                    {service.duration_minutes && (
                      <p className="service-duration">{service.duration_minutes} minutes</p>
                    )}
                    {service.is_active === false && <span className="inactive-badge">Inactive</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {profile.bookings && profile.bookings.length > 0 && (
        <div className="bookings-section">
          <h2>My Bookings</h2>
          <div className="bookings-list">
            {profile.bookings.map(booking => (
              <div key={booking.booking_id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.service_title || 'Unknown Service'}</h3>
                  <span className={`booking-status ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status || 'pending'}
                  </span>
                </div>
                <div className="booking-details">
                  <p><strong>Provider:</strong> {booking.provider_name || 'Unknown Provider'}</p>
                  <p><strong>Date:</strong> {formatDate(booking.booking_date)}</p>
                  <p><strong>Address:</strong> {booking.address || 'Not specified'}</p>
                  <p><strong>Amount:</strong> ${booking.total_amount?.toFixed(2) || '0.00'}</p>
                  <p><strong>Payment:</strong> 
                    <span className={`payment-status ${booking.payment_status || 'pending'}`}>
                      {booking.payment_status || 'pending'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-actions">
        <button 
          onClick={() => {
            setIsEditing(true);
            showToast('Editing profile', 'info');
          }} 
          className="edit-button"
          disabled={loading}
        >
          Edit Profile
        </button>
        {profile.role === 'provider' && (
          <button 
            onClick={() => {
              navigate('/services/manage');
              showToast('Navigating to services management', 'info');
            }} 
            className="manage-services-button"
            disabled={loading}
          >
            Manage Services
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;