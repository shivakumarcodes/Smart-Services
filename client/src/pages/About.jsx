import React,{ useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link } from 'react-router-dom';
import { FaCheck, FaBolt, FaHeart, FaArrowRight } from 'react-icons/fa';
import '../styles/AboutPage.css';

const About = () => {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }, []);
  return (
    <div className="about-page">
      {/* Hero Section with Animated Gradient */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 data-aos="fade-up">Redefining Service Experiences</h1>
          <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="100">
            Connecting you with trusted professionals for all your service needs
          </p>
          <Link 
            to="/services" 
            className="hero-cta"
            data-aos="fade-up" 
            data-aos-delay="200"
          >
            Explore Services <FaArrowRight className="cta-icon" />
          </Link>
        </div>
        <div className="hero-pattern"></div>
      </section>

      {/* Mission Section with Animated Stats */}
      <section className="mission-section">
        <div>
          <div className="values-content" data-aos="fade-right">
            <h2 className='section-title'>Our Mission</h2>
            <p className="content">
              At Smart Services, we're transforming how people find and book local services. 
              Our platform bridges the gap between skilled professionals and customers who 
              need quality services done right.
            </p>
            <div className="mission-stats">
              <div className="value-card" data-aos="zoom-in" data-aos-delay="100">
                <h3>10,000+</h3>
                <p>Happy Customers</p>
              </div>
              <div className="value-card" data-aos="zoom-in" data-aos-delay="200">
                <h3>500+</h3>
                <p>Verified Professionals</p>
              </div>
              <div className="value-card" data-aos="zoom-in" data-aos-delay="300">
                <h3>50+</h3>
                <p>Service Categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Interactive Cards */}
      <section className="values-section">
        <div>
          <h2 className="section-title" data-aos="fade-up">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card" data-aos="fade-up" data-aos-delay="100">
              <div className="value-icon">
                <FaCheck />
              </div>
              <h3>Trust & Transparency</h3>
              <p>
                Verified professionals with transparent ratings and reviews so you 
                know exactly who you're hiring.
              </p>
            </div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="200">
              <div className="value-icon">
                <FaBolt />
              </div>
              <h3>Convenience</h3>
              <p>
                Book services in minutes with our easy-to-use platform available 
                anytime, anywhere.
              </p>
            </div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="300">
              <div className="value-icon">
                <FaHeart />
              </div>
              <h3>Quality Assurance</h3>
              <p>
                We maintain high standards so every service meets your expectations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section with Hover Effects */}
      <section className="team-section">
        <div className="div-container">
          <h2 className="section-title" data-aos="fade-up">Meet The Team</h2>
          <div className="team-grid">
            <div className="team-member" data-aos="fade-up" data-aos-delay="100">
              <div className="member-photo photo-1"></div>
              <h3>Shiva Kumar</h3>
              <p className="position">Founder & CEO</p>
              <div className="social-links">
                <a href="#linkedin" aria-label="LinkedIn">in</a>
                <a href="#twitter" aria-label="Twitter">tw</a>
              </div>
            </div>
            <div className="team-member" data-aos="fade-up" data-aos-delay="200">
              <div className="member-photo photo-2"></div>
              <h3>Sarah Chen</h3>
              <p className="position">Head of Operations</p>
              <div className="social-links">
                <a href="#linkedin" aria-label="LinkedIn">in</a>
                <a href="#twitter" aria-label="Twitter">tw</a>
              </div>
            </div>
            <div className="team-member" data-aos="fade-up" data-aos-delay="300">
              <div className="member-photo photo-3"></div>
              <h3>Michael Rodriguez</h3>
              <p className="position">Technology Lead</p>
              <div className="social-links">
                <a href="#linkedin" aria-label="LinkedIn">in</a>
                <a href="#twitter" aria-label="Twitter">tw</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;