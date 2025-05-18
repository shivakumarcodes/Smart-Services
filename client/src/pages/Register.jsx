import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user',
    serviceType: '',
    description: '',
    experienceYears: ''
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error as user types
    if (errors[name] || errors.api) {
      setErrors(prev => ({ ...prev, [name]: '', api: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any file-related errors
      if (errors.profilePicture) {
        setErrors(prev => ({ ...prev, profilePicture: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    const { name, email, password, confirmPassword, role, serviceType, description, experienceYears } = formData;

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (role === 'provider') {
      if (!serviceType.trim()) newErrors.serviceType = 'Service type is required';
      if (!description.trim()) newErrors.description = 'Description is required';
      if (!experienceYears) newErrors.experienceYears = 'Years of experience is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Create FormData object to handle file upload
      const formDataToSend = new FormData();
      
      // Add all text fields to FormData
      Object.keys(formData).forEach(key => {
        // Skip confirmPassword as it's not needed on the server
        if (key !== 'confirmPassword') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add profile picture if one was selected
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const response = await axios.post('https://smart-services.onrender.com/api/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.message.includes('Network Error') ? 'Network error. Please check your connection.' : 'Registration failed.');
      setErrors({ api: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <header className="register-header">
          <h2>Create an Account</h2>
          <p>Join our community of service providers and clients</p>
        </header>

        {errors.api && (
          <div className="error-message" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data" noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              autoFocus
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              aria-invalid={!!errors.name}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture</label>
            <div className="image-upload-container">
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="Profile preview" 
                  className="profile-preview"
                />
              )}
              <input 
                type="file"
                id="profilePicture"
                name="profilePicture"
                onChange={handleFileChange}
                accept="image/*"
                disabled={isSubmitting}
              />
              {errors.profilePicture && <span className="error-text">{errors.profilePicture}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className={errors.password ? 'error' : ''}
                  placeholder="••••••••"
                />
                {/* <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="toggle-password"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button> */}
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Register as</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">Service Client</option>
              <option value="provider">Service Provider</option>
            </select>
          </div>

          {formData.role === 'provider' && (
            <>
              <div className="form-group">
                <label htmlFor="serviceType">Service Type</label>
                <input
                  type="text"
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className={errors.serviceType ? 'error' : ''}
                />
                {errors.serviceType && <span className="error-text">{errors.serviceType}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Short Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={errors.description ? 'error' : ''}
                  rows="3"
                ></textarea>
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="experienceYears">Years of Experience</label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  min="0"
                  className={errors.experienceYears ? 'error' : ''}
                />
                {errors.experienceYears && <span className="error-text">{errors.experienceYears}</span>}
              </div>
            </>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;