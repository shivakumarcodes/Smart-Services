import React from 'react';
import '../styles/TestimonialCard.css';

export default function TestimonialCard() {
  return (
    <div className="testimonial-card">
      <div className="quote-curve">
        <svg width="100" height="80" viewBox="0 0 100 80" className="quote-svg">
          <path 
            d="M20,0 Q50,20 80,0" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2"
          />
        </svg>
        <span className="quote-mark">"</span>
      </div>
      <p className="testimonial-text">
        Booking a plumber was quick and easy. The service provider was professional and did a great job!
      </p>
      <div className="testimonial-author">
        <div className="author-info">
          <span className="author-name">Sarah Johnson</span>
          <span className="author-role">Homeowner</span>
        </div>
      </div>
    </div>
  );
}