import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/HeroBanner.css';

const services = [
  {
    name: 'Certified Electricians',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2940&auto=format&fit=crop',
  },
  {
    name: 'Expert Plumbers',
    image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=2940&auto=format&fit=crop',
  },
  {
    name: 'Professional Beauticians',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2940&auto=format&fit=crop',
  },
  {
    name: 'Reliable Cleaning Services',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2940&auto=format&fit=crop',
  },
  {
    name: 'Skilled Carpenters',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2940&auto=format&fit=crop',
  }
];

const Button = ({ children, onClick, className = '' }) => (
  <button className={`hero-button ${className}`} onClick={onClick}>
    {children}
  </button>
);

const ChevronLeft = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
);

const ChevronRight = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });
  }, []);

  const goToServices = () => {
    navigate('/services');
  };

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const scrollPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  const scrollNext = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  return (
    <section className="hero-banner-section">
      <div className="hero-banner-embla-wrapper">
        <div className="hero-banner-embla-container">
          {services.map((service, index) => (
            <div 
              className={`embla__slide ${index === currentSlide ? 'active' : ''}`} 
              key={index}
              style={{ 
                transform: `translateX(${(index - currentSlide) * 100}%)`,
                opacity: index === currentSlide ? 1 : 0
              }}
              data-aos="fade-in"
              data-aos-delay={index * 100}
            >
              <div className="hero-banner-slide-image" style={{ backgroundImage: `url(${service.image})` }}>
                <div className="hero-banner-slide-overlay">
                   <h3 className="hero-banner-slide-title" data-aos="fade-up" data-aos-delay="300">
                     {service.name}
                   </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="hero-banner-main-overlay"></div>
      <div className="hero-banner-content">
        <h1 className="hero-banner-title" data-aos="fade-down" data-aos-delay="200">
          Your Trusted Service Marketplace
        </h1>
        <p className="hero-banner-subtitle" data-aos="fade-up" data-aos-delay="300">
          Connect with skilled professionals for any job, big or small. From electricians to beauticians, find the help you need, right when you need it.
        </p>
        <div className="hero-banner-button-wrapper" data-aos="zoom-in" data-aos-delay="400">
          <Button onClick={goToServices}>
            Find a Service
          </Button>
        </div>
      </div>
      
      <div className="hero-banner-prev-button-wrapper" data-aos="fade-right" data-aos-delay="500">
        <Button onClick={scrollPrev}>
          <ChevronLeft className="hero-banner-nav-icon" />
        </Button>
      </div>
      
      <div className="hero-banner-next-button-wrapper" data-aos="fade-left" data-aos-delay="500">
        <Button onClick={scrollNext}>
          <ChevronRight className="hero-banner-nav-icon" />
        </Button>
      </div>
    </section>
  );
}

export default HeroBanner;