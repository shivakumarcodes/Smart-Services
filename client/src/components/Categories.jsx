import React from 'react';
import CategoryCard from './CategoryCard';
import '../styles/CategoriesCardsContainer.css';
import { useNavigate } from 'react-router-dom';

export default function Categories() {
  const navigate = useNavigate();
  const categories = [
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Photography', icon: '📷' },
    { name: 'Plumbing', icon: '🚿' },
    { name: 'Electrical', icon: '💡' }
  ];

  const handleCategoryClick = (categoryName) => {
    navigate(`/categories/${categoryName.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="div-container">
      <h2 className="categories-title">Popular Categories</h2>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <CategoryCard 
            key={index} 
            name={category.name} 
            onClick={() => handleCategoryClick(category.name)} 
            icon={category.icon} 
          />
        ))}
      </div>
    </div>
  );
}