import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/NewServiceForm.css';

const NewServiceForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    basePrice: '',
    durationMinutes: '',
  });
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Photographer',
    'Painting',
    'Moving',
    'Gardening',
    'Handyman',
    'Appliance Repair',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    setImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]); // Clean up memory
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form data
    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.basePrice) {
      setError('Title, description, category and base price are required');
      setLoading(false);
      return;
    }

    if (isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) <= 0) {
      setError('Price must be a positive number');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('basePrice', formData.basePrice);
      if (formData.durationMinutes) {
        formDataToSend.append('durationMinutes', formData.durationMinutes);
      }

      // Append each image file
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const response = await axios.post('http://localhost:5000/api/services', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/provider/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating service:', err);
      setError(err.response?.data?.message || 'Failed to create service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-container">
        <h2>Service Created Successfully!</h2>
        <p>You will be redirected to your dashboard shortly.</p>
      </div>
    );
  }

  return (
    <div className="new-service-container">
      <div className="form-header">
        <h1>Create New Service</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/provider/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="service-form">
        <div className="form-group">
          <label htmlFor="title">Service Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Professional Home Cleaning"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your service in detail..."
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="basePrice">Base Price (USD)*</label>
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="50.00"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="durationMinutes">Duration (minutes)</label>
            <input
              type="number"
              id="durationMinutes"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              min="15"
              step="15"
              placeholder="60"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Service Images</label>
          <div className="image-upload-container">
            <label htmlFor="images" className="image-upload-label">
              <span>+ Upload Images</span>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-upload-input"
              />
            </label>
            
            {previewImages.length > 0 && (
              <div className="image-preview-container">
                {previewImages.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index}`} />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="image-hint">First image will be used as the primary image for your service</p>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewServiceForm;