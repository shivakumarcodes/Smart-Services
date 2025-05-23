import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Services.css';

// Constants for filter options
const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Siddipet', label: 'Siddipet' },
  { value: 'Karimnagar', label: 'Karimnagar' }
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Home Cleaning', label: 'Home Cleaning' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Tutoring', label: 'Tutoring' },
  { value: 'Photography', label: 'Photography' },
  { value: 'IT Support', label: 'IT Support' }
];

const PRICE_RANGE_OPTIONS = [
  { value: '', label: 'All Prices' },
  { value: '0-50', label: '$0 - $50' },
  { value: '50-100', label: '$50 - $100' },
  { value: '100-', label: '$100+' }
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Add this useEffect hook to the Services component (near the top of the component)
  useEffect(() => {
    // Parse initial query parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    const initialSearch = searchParams.get('search') || '';
    const initialLocation = searchParams.get('location') || '';

    // Set initial filter state from URL parameters
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
      // console.log(servicesData)
      
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

  // Effect for page changes
  useEffect(() => {
    // Only update displayed services if we have data
    if (allServices.length) {
      updateDisplayedServices(allServices, currentPage);
      // Scroll to top of results when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, allServices]);

  // Debounced effect for filters
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      // Reset to first page when filters change
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
    return isNaN(numericPrice) ? '$0.00' : `$${numericPrice.toFixed(2)}`;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    // Scroll to top of results when changing pages
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

    // Create array of page numbers to show
    const pageNumbers = [];
    const maxVisiblePages = 5;

    // Logic to show ellipsis for many pages
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);

      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page if more than 1
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return (
      <div className="pagination">
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
      <div className="div-container">
        <h1 className="categories-title">Browse Services</h1>
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              aria-label="Search services"
            />
            <div className="location-filter">
              <select 
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                aria-label="Filter by location"
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
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {CATEGORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="price-filter">Price Range</label>
            <select
              id="price-filter"
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
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

      {loading ? (
        <div className="loading" aria-live="polite">Loading services...</div>
      ) : (
        <>        
          <div className="service-grid">
            {displayedServices.length > 0 ? (
              displayedServices.map(service => (
                <article 
                  key={service.service_id} 
                  className="service-card"
                  onClick={() => handleServiceClick(service.service_id)}
                  tabIndex="0"
                  role="button"
                  aria-label={`Service: ${service.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleServiceClick(service.service_id)}
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
                      <i className="fas fa-map-marker-alt" aria-hidden="true"></i> {service.location}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="no-results">No services found matching your criteria.</p>
            )}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default Services;