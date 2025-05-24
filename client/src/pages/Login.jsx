import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Guest login credentials
  const guestCredentials = {
    user: { email: 'user@gmail.com', password: 'password123' },
    provider: { email: 'provider@gmail.com', password: 'password123' },
    admin: { email: 'admin@smartservices.com', password: 'password123' }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};
        
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
        
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performLogin = async (credentials) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await axios.post('https://smart-services.onrender.com/api/login', credentials);
            
      if (response.data.token) {
        login(response.data.token);
        navigate('/profile');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrors({ api: err.response.data.message });
      } else {
        setErrors({ api: 'Login failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
        
    if (!validate()) return;
        
    await performLogin(formData);
  };

  const handleGuestLogin = async (userType) => {
    setShowGuestModal(false);
    const credentials = guestCredentials[userType];
    await performLogin(credentials);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Log in to access your account</p>
        </div>
                
        {errors.api && <div className="error-message">{errors.api}</div>}
                
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
                    
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
                    
          {/* <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div> */}
                    
          <button 
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>

          <button 
            type="button"
            className="guest-login-button"
            onClick={() => setShowGuestModal(true)}
            disabled={isSubmitting}
          >
            Guest Login
          </button>
        </form>

        {/* Guest Login Modal */}
        {showGuestModal && (
          <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Guest Login Type</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowGuestModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <button 
                  className="guest-option-button"
                  onClick={() => handleGuestLogin('user')}
                  disabled={isSubmitting}
                >
                  Login as User
                </button>
                <button 
                  className="guest-option-button"
                  onClick={() => handleGuestLogin('provider')}
                  disabled={isSubmitting}
                >
                  Login as Provider
                </button>
                <button 
                  className="guest-option-button"
                  onClick={() => handleGuestLogin('admin')}
                  disabled={isSubmitting}
                >
                  Login as Admin
                </button>
              </div>
            </div>
          </div>
        )}
                
        <div className="register-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;