import React from 'react';
import PropTypes from 'prop-types';
import '../styles/FeaturedServiceCard.css';

const FeaturedServiceCard = ({
  providerPhoto = '',
  providerName,
  serviceType,
  experience_years = 0,
  rating = 4,
  onClick,
  isLoading = false
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const renderStars = (ratingValue) => {
    const numericRating = typeof ratingValue === 'number' && !isNaN(ratingValue)
      ? Math.min(Math.max(ratingValue, 0), 5)
      : 0;

    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    return (
      <div className="provider-rating" aria-label={`Rating: ${numericRating.toFixed(1)} out of 5`}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <span key={i} className="star filled">★</span>;
          }
          if (i === fullStars && hasHalfStar) {
            return <span key={i} className="star half">★</span>;
          }
          return <span key={i} className="star empty">★</span>;
        })}
        <span className="rating-value">{numericRating.toFixed(1)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="featured-card loading">
        <div className="provider-photo-container shimmer"></div>
        <div className="provider-info">
          <div className="provider-name shimmer"></div>
          <div className="provider-category shimmer"></div>
          <div className="provider-rating shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="featured-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      role="button"
      aria-label={`View details for ${providerName}, ${serviceType} provider`}
    >
      <div className="provider-photo-container">
        <img
          src={providerPhoto || 'https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg'}
          alt={`${providerName}`}
          className="provider-photo"
          loading="lazy"
          onError={(e) => {
            e.target.src = '/default-avatar.jpg';
            e.target.alt = 'Default provider avatar';
          }}
        />
      </div>
      <div className="provider-info">
        <h3 className="provider-name">{providerName}</h3>
        <p className="provider-category">{serviceType}</p>
        {renderStars(rating)}
        <div className="experience-info">
          {experience_years} years of experience
        </div>
      </div>
    </article>
  );
};

FeaturedServiceCard.propTypes = {
  providerPhoto: PropTypes.string,
  providerName: PropTypes.string.isRequired,
  serviceType: PropTypes.string.isRequired,
  experience_years: PropTypes.number,
  rating: PropTypes.number,
  onClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default FeaturedServiceCard;