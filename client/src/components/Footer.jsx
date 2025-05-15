import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <h3 className="footer-heading">ServiceFinder</h3>
          <p className="footer-text">
            Connecting you with trusted professionals for all your home service needs.
          </p>
          <div className="social-li">
            <a href="#" className="social-icon" aria-label="Facebook">
              <FaFacebookF /><p>Facebbok</p>
            </a>
            <a href="#" className="social-icon" aria-label="Twitter">
              <FaTwitter /><p>Twitter</p>
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <FaInstagram /><p>Instagram</p>
            </a>
            <a href="#" className="social-icon" aria-label="LinkedIn">
              <FaLinkedinIn /><p>LinkedinIn</p>
            </a>
          </div>
        </div>

{/* Quick Links */}
<div className="footer-section">
  <h3 className="footer-heading">Quick Links</h3>
  <ul className="footer-links">
    <li><Link to="/">Home</Link></li>
    <li><Link to="/services">Services</Link></li>
    <li><Link to="/about">About Us</Link></li>
    <li><Link to="/about">Contact</Link></li> {/* Only include this if you have a /contact route */}
  </ul>
</div>


        {/* Contact Info */}
        <div className="footer-section">
          <h3 className="footer-heading">Contact Us</h3>
          <ul className="footer-contact">
            <li>📞 +91 9618244562</li>
            <li>✉️ galishivakumar2002@gmail.com</li>
            <li>📍 500001, Hyderabad, India</li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ServiceFinder. All rights reserved.</p>
      </div>
    </footer>
  );
}