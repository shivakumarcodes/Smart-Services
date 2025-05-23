import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeaturedServiceCard from './FeaturedServiceCard';
import '../styles/FeaturedServices.css';

const FeaturedServices = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedProviders = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://smart-services.onrender.com/api/providers', {
          params: {
            isApproved: 'true',
            minRating: 4.5,
            limit: 6
          }
        });
        setProviders(response.data.slice(0, 6));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching featured providers:', err);
        setError('Failed to load featured providers');
        setLoading(false);
      }
    };

    fetchFeaturedProviders();
  }, []);

  const handleProviderClick = (providerId) => {
    navigate(`/providers/${providerId}`);
  };

  if (loading) {
    return (
      <div className="div-container">
        <h2 className="categories-title">Featured Service Providers</h2>
        <div className="loading-container" aria-live="polite">
          <p>Loading featured providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="div-container">
        <h2 className="categories-title">Featured Service Providers</h2>
        <div className="error-container" aria-live="polite">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="div-container">
      <h2 className="categories-title">Featured Service Providers</h2>
      {providers.length > 0 ? (
        <div className="featured-services-grid">
          {providers.map(provider => {
            const {
              provider_id,
              profile_picture_url,
              provider_name,
              service_type,
              experience_years,
              rating
            } = provider;

            return (
              <FeaturedServiceCard
                key={provider_id}
                providerPhoto={profile_picture_url}
                providerName={provider_name}
                serviceType={service_type}
                experience_years={experience_years}
                rating={Number(rating) || 4.5}
                onClick={() => handleProviderClick(provider_id)}
              />
            );
          })}
        </div>
      ) : (
        <p className="no-results">No featured providers available at this time.</p>
      )}
    </div>
  );
};

export default FeaturedServices;
