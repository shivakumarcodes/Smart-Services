import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location]);

  // Create a memoized fetchProfile function using useCallback
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        const response = await axios.get('https://smart-services.onrender.com/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfile(response.data);
        setImageError(false); // Reset image error when profile updates
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If token is invalid, log user out
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [user, logout]);

  // Add a dependency on location.pathname to refetch profile when navigating to different pages
  // This ensures profile data is refreshed when returning from profile edit page
  useEffect(() => {
    // Only fetch profile when user is logged in
    if (user) {
      fetchProfile();
    } else {
      // Clear profile when user logs out
      setProfile(null);
      setImageError(false);
    }
  }, [user, location.pathname, fetchProfile]); // Add location dependency to trigger refetch on navigation

  // Add event listener to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    // Add event listener if dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener on unmount or when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
    setProfile(null);
    setImageError(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Get profile picture URL with proper handling
  const getProfilePictureUrl = () => {
    // First check profile from API
    if (profile?.profilePicture) {
      return profile.profilePicture.startsWith('http')
        ? profile.profilePicture
        : `https://smart-services.onrender.com${profile.profilePicture}`;
    }
    
    // Fallback to user info from auth context
    if (user?.profile_picture_url) {
      return user.profile_picture_url.startsWith('http')
        ? user.profile_picture_url
        : `https://smart-services.onrender.com${user.profile_picture_url}`;
    }
    
    return null;
  };

  const getUserInitial = () => {
    // Function to extract initials from a name
    const getInitialsFromName = (name) => {
      if (!name || typeof name !== 'string') return 'U';
      
      const nameParts = name.trim().split(' ');
      let initials = nameParts[0].charAt(0).toUpperCase();
      
      // Add last initial if available
      if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      }
      
      return initials;
    };
    
    // Try profile from API first
    if (profile?.name) {
      return getInitialsFromName(profile.name);
    }
    
    // Fall back to user from auth context
    if (user?.name) {
      return getInitialsFromName(user.name);
    }
    
    // If user exists but has no name property
    if (user) {
      // Try to use email or username if available
      if (user.email) {
        return user.email.charAt(0).toUpperCase();
      }
      if (user.username) {
        return user.username.charAt(0).toUpperCase();
      }
    }
    
    return 'U'; // Ultimate fallback
  };

  // Get display name with comprehensive fallbacks
  const getDisplayName = () => {
    // Try profile from API first
    if (profile?.name) {
      return profile.name;
    }
    
    // Fall back to user from auth context
    if (user?.name) {
      return user.name;
    }
    
    // Try other user properties
    if (user) {
      if (user.username) return user.username;
      if (user.email) {
        // Return email without domain if possible
        const emailParts = user.email.split('@');
        return emailParts[0] || user.email;
      }
    }
    
    return 'User'; // Ultimate fallback
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Smart Services
        </Link>

        <button 
          className="menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/services" className={isActive('/services')}>Services</Link>
          <Link to="/about" className={isActive('/about')}>About Us</Link>
          
          {user ? (
            <div className="profile-menu" ref={dropdownRef}>
              <button 
                className="profile-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-label="Profile menu"
              >
                <div className="profile-avatar-container">
                  {getProfilePictureUrl() && !imageError ? (
                    <img 
                      src={getProfilePictureUrl()}
                      alt={getDisplayName()} 
                      className="profile-pic"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="profile-initial">
                      {getUserInitial()}
                    </div>
                  )}
                </div>
                <span className="profile-name">{getDisplayName()}</span>
                <svg 
                  className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    My Profile
                  </Link>
                  
                  {(profile?.role === 'provider' || user?.role === 'provider') && (
                    <Link 
                      to="/provider/dashboard" 
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.861 5.151 14.848 5.14 15.235 5.309C16.875 6.004 17.996 7.125 18.691 8.765C18.86 9.152 18.849 10.139 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C18.849 13.861 18.86 14.848 18.691 15.235C17.996 16.875 16.875 17.996 15.235 18.691C14.848 18.86 13.861 18.849 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.139 18.849 9.152 18.86 8.765 18.691C7.125 17.996 5.996 16.875 5.309 15.235C5.14 14.848 5.151 13.861 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C5.151 10.139 5.14 9.152 5.309 8.765C6.004 7.125 7.125 5.996 8.765 5.309C9.152 5.14 10.139 5.151 10.325 4.317Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Provider Dashboard
                    </Link>
                  )}
                  
                  {(profile?.role === 'admin' || user?.role === 'admin') && (
                    <Link 
                      to="/admin/dashboard" 
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={`login-button ${isActive('/login')}`}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;