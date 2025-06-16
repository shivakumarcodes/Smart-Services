import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
// import Categories from "../components/Categories";
import CategoryCard from '../components/CategoryCard';
import FeaturedServices from "../components/FeaturedServices";
import SearchBar from "../components/SearchBar";
import TestimonialCard from "../components/testimonialCard";
import HeroBanner from "../components/HeroBanner";
import '../styles/CategoriesCardsContainer.css';
import '../styles/Home.css';

const Home = () => {
    const categories = [
      { name: 'Cleaning', icon: '🧹' },
      { name: 'Photography', icon: '📷' },
      { name: 'Plumbing', icon: '🚿' },
      { name: 'Electrical', icon: '💡' }
    ];

  useEffect(() => {
    AOS.init({
      duration: 800,              // Slightly longer duration for better visibility
      easing: 'ease-in-out-quart', // Smoother easing function
      once: true,                // Animations only happen once
      mirror: false,             // Don't repeat when scrolling back up
      offset: 120,               // Trigger animations 120px before element comes into view
      delay: 100,                // Slight delay between items
    });
    
    // Refresh AOS when components load (for dynamic content)
    AOS.refresh();
  }, []);

  return (
    <div className="home-container" style={{ maxWidth: '1300px'}}>
      <HeroBanner />
      {/* Hero Section */}
      <div 
        className="div-container"
        data-aos="fade-up"
        data-aos-delay="50"
      >
        <h1 
          className="Hero-title"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Find a trusted service provider
        </h1>
        <p 
          className="categories-title"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          Book services from top-rated professionals
        </p>
        <div data-aos="fade-up" data-aos-delay="200">
          <SearchBar />
        </div>
      </div>

      {/* Categories Section */}
      <div data-aos="fade-up" data-aos-delay="50">
        <div className="popular-categories-container">
              <h2 className="categories-title">Popular Categories</h2>
              <div className="categories-grid">
                {categories.map((category, index) => (
                  <CategoryCard 
                    key={index} 
                    name={category.name} 
                    icon={category.icon} 
                  />
                ))}
              </div>
            </div>
      </div>

      {/* Featured Services */}
      <div data-aos="fade-up" data-aos-delay="100">
        <FeaturedServices />
      </div>

      {/* Testimonials Section */}
      <div className="testimonials-section">
        <h1 
          className="categories-title"
          data-aos="fade-up"
          data-aos-delay="50"
        >
          What our users say
        </h1>
        <div data-aos="fade-up" data-aos-delay="100">
          <TestimonialCard />
        </div>
      </div>
    </div>
  );
};

export default Home;