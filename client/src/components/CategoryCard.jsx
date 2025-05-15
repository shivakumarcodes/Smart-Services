import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CategoryCard.css';

export default function CategoryCard({ name, icon }) {
  const navigate = useNavigate();
  const handleCategoryClick = (categoryName) => {
        navigate(`/categories/${categoryName.toLowerCase().replace(/\s+/g, '-')}`);
      };
  return (
    <div className="category-card" onClick={() => handleCategoryClick(name)} >
      <div className="category-icon">{icon}</div>
      <h3 className="category-name">{name}</h3>
    </div>
  );
}