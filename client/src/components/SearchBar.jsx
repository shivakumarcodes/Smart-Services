import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SearchBar.css';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Navigate to services page with query parameters that match the Services component's filter structure
    navigate(`/services?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-bar-form">
        <div className="search-input-group">
          <label htmlFor="service" className="search-label">
            What service do you need?
          </label>
          <input
            type="text"
            id="service"
            placeholder="e.g. Cleaning, Plumbing"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="search-input-group">
          <label htmlFor="location" className="search-label">
            Where?
          </label>
          <input
            type="text"
            id="location"
            placeholder="e.g. Hyderabad, Siddipet"
            className="search-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        <div className="search-button-container">
          <button
            type="submit"
            className="search-button"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}