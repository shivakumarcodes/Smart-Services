import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Services.css';

// Constants for filter options
const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Siddipet', label: 'Siddipet' },
  { value: 'Karimnagar', label: 'Karimnagar' }
];

const PRICE_RANGE_OPTIONS = [
  { value: '', label: 'All Prices' },
  { value: '0-50', label: '₹0 - ₹50' },
  { value: '50-100', label: '₹50 - ₹100' },
  { value: '100-', label: '₹100+' }
];

// Items to display per page
const ITEMS_PER_PAGE = 8;

const Services = () => {
  const [allServices, setAllServices] = useState([]);
  const [displayedServices, setDisplayedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    category: '',
    priceRange: ''
  });

  const [categoryOptions, setCategoryOptions] = useState([{ value: '', label: 'All Categories' }]);

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 200,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://smart-services.onrender.com/api/categories');
        const dynamicOptions = res.data.categories.map(category => ({
          value: category,
          label: category
        }));
        setCategoryOptions([{ value: '', label: 'All Categories' }, ...dynamicOptions]);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Parse initial query parameters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialSearch = searchParams.get('search') || '';
    const initialLocation = searchParams.get('location') || '';

    setFilters(prev => ({
      ...prev,
      search: initialSearch,
      location: initialLocation
    }));
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {
        search: filters.search,
        location: filters.location,
        category: filters.category
      };

      // Handle price range if selected
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange.split('-');
        if (minPrice) params.minPrice = parseFloat(minPrice);
        if (maxPrice) params.maxPrice = parseFloat(maxPrice.replace('+', ''));
      }

      const response = await axios.get('https://smart-services.onrender.com/api/services', { params });
      const servicesData = response.data.services || [];
      setAllServices(servicesData);
      
      // Calculate pagination information
      setTotalItems(servicesData.length);
      setTotalPages(Math.ceil(servicesData.length / ITEMS_PER_PAGE));
      
      // Set displayed services for the current page
      updateDisplayedServices(servicesData, 1);
    } catch (err) {
      console.error('Error fetching services:', err);
      setAllServices([]);
      setDisplayedServices([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Update displayed services based on current page
  const updateDisplayedServices = (services, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedServices(services.slice(startIndex, endIndex));
  };

  const getRandomLocation = () => {
    const locations = ["Hyderabad", "Karimnagar", "Siddipet"];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  // Effect for page changes
  useEffect(() => {
    if (allServices.length) {
      updateDisplayedServices(allServices, currentPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, allServices]);

  // Debounced effect for filters
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchServices();
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleServiceClick = (serviceId) => {
    if (!serviceId) return;
    navigate(`/services/${serviceId}`);
  };

  const getPrimaryImage = (service) => {
    const imageUrl = service.primary_image_url;
    if (!imageUrl) {
      return 'https://placehold.co/400x300.png?text=Service+Image&font=roboto';
    }
    return imageUrl.startsWith('http')
      ? imageUrl
      : `https://smart-services.onrender.com${imageUrl}`;
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price);
    return isNaN(numericPrice) ? '₹0.00' : `₹${numericPrice.toFixed(2)}`;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStars = (rating, reviewCount) => {
    return (
      <div className="service-rating" aria-label={`Rating: ${rating} out of 5`}>
        {[...Array(5)].map((_, i) => (
          <span 
            key={i} 
            className={i < Math.floor(rating || 0) ? 'filled' : ''}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        <span>({reviewCount || 0})</span>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);

      if (startPage > 2) {
        pageNumbers.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return (
      <div className="pagination" data-aos="fade-up" data-aos-delay="100">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="pagination-button"
        >
          &laquo; Prev
        </button>
        
        <div className="page-numbers">
          {pageNumbers.map((number, index) => (
            typeof number === 'number' ? (
              <button
                key={index}
                onClick={() => handlePageChange(number)}
                className={currentPage === number ? 'active' : ''}
                aria-current={currentPage === number ? 'page' : undefined}
                aria-label={`Page ${number}`}
                data-aos="zoom-in"
                data-aos-delay={index * 50}
              >
                {number}
              </button>
            ) : (
              <span key={index} className="ellipsis" aria-hidden="true">
                {number}
              </span>
            )
          ))}
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="pagination-button"
        >
          Next &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="services-page">
      <div className="services-browser-container">
        {/* Doodle background elements */}
        <div className="doodle-bg">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="doodle-element"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random() * 0.7})`,
                opacity: 0.3 + Math.random() * 0.4
              }}
            />
          ))}
        </div>
        
        <div className="services-content">
          <h1 className="services-title" data-aos="fade-down" data-aos-delay="50">
            <span className="title-text">Browse Services</span>
            <span className="title-decoration"></span>
          </h1>
          
          <div className="search-section" data-aos="fade-up" data-aos-delay="100">
            <div className="search-bar-wrapper">
              <div className="search-input-container" data-aos="fade-right" data-aos-delay="150">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 15H14.71L14.43 14.73C15.41 13.59 16 12.11 16 10.5C16 6.91 13.09 4 9.5 4C5.91 4 3 6.91 3 10.5C3 14.09 5.91 17 9.5 17C11.11 17 12.59 16.41 13.73 15.43L14 15.71V16.5L19 21.49L20.49 20L15.5 15Z" fill="currentColor"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  aria-label="Search services"
                  className="search-input"
                />
              </div>
              
              <div className="location-select-container" data-aos="fade-left" data-aos-delay="150">
                <svg className="location-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                <select 
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  aria-label="Filter by location"
                  className="location-select"
                >
                  {LOCATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="filters-section" data-aos="fade-up" data-aos-delay="200">
            <div className="filter-group" data-aos="zoom-in" data-aos-delay="250">
              <label htmlFor="category-filter" className="filter-label">
                <svg className="filter-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.25 5.61C6.27 8.2 10 13 10 13V19C10 19.55 10.45 20 11 20H13C13.55 20 14 19.55 14 19V13C14 13 17.72 8.2 19.74 5.61C20.25 4.95 19.78 4 18.95 4H5.04C4.21 4 3.74 4.95 4.25 5.61Z" fill="currentColor"/>
                </svg>
                Category
              </label>
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group" data-aos="zoom-in" data-aos-delay="300">
              <label htmlFor="price-filter" className="filter-label">
                <svg className="filter-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 12.5 5.19V3H10.5V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.29C6.43 17.19 8.08 18.42 10.5 18.83V21H12.5V18.85C14.96 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" fill="currentColor"/>
                </svg>
                Price Range
              </label>
              <select
                id="price-filter"
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="filter-select"
              >
                {PRICE_RANGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading" aria-live="polite" data-aos="fade-in">
          <div className="loading-spinner"></div>
          Loading services...
        </div>
      ) : (
        <>        
          <div className="service-grid">
            {displayedServices.length > 0 ? (
              displayedServices.map((service, index) => (
                <article 
                  key={service.service_id} 
                  className="service-card"
                  onClick={() => handleServiceClick(service.service_id)}
                  tabIndex="0"
                  role="button"
                  aria-label={`Service: ${service.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleServiceClick(service.service_id)}
                  data-aos="fade-up"
                  // data-aos-delay={index % 8 * 50}
                >
                  <div className="service-image">
                    <img 
                      src={getPrimaryImage(service)} 
                      alt={service.title}
                      onError={(e) => {
                        e.target.src = '/default-service.jpg';
                      }}
                    />
                  </div>
                  <div className="service-details">
                    <h2>{service.title}</h2>
                    <p className="service-provider">by {service.provider_name}</p>
                    {renderStars(service.provider_rating, service.review_count)}
                    <p className="service-price">{formatPrice(service.base_price)}</p>
                    <p className="service-location">
                      <i className="fas fa-map-marker-alt" aria-hidden="true"></i>{" "}
                      {service.location ?? getRandomLocation()}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="no-results" data-aos="fade-in">
                No services found matching your criteria.
              </p>
            )}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default Services;