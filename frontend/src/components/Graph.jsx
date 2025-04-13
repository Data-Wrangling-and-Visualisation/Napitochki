import React, { useState, useEffect } from "react";
import { getAllDrinks, getAllTastes } from "../api/drinks";
import DrinkInfo from "./DrinkInfo";
import HoneycombChart from "./visualizations/HoneycombChart";
import { getClusterLabel } from "../utils/clusterDescriptions";
import "./Graph.css";

export default function Graph() {
  const [drinks, setDrinks] = useState([]);
  const [tastes, setTastes] = useState([]);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [colorBy, setColorBy] = useState('cluster'); // 'cluster', 'taste', or 'category'
  const [embeddingType, setEmbeddingType] = useState('combined'); // 'text', 'image', or 'combined'

  useEffect(() => {
    async function fetchData() {
      try {
        const [drinksData, tastesData] = await Promise.all([
          getAllDrinks(),
          getAllTastes()
        ]);
        
        // Process drinks data to extract coordinates from position field
        const processedDrinks = drinksData.map(drink => {
          // If the drink has position data, return it as is
          if (drink.position) {
            return drink;
          }
          
          // Otherwise, generate placeholder coordinates (legacy support)
          return {
            ...drink,
            position: {
              text: [Math.random() * 50 - 25, Math.random() * 50 - 25],
              image: [Math.random() * 50 - 25, Math.random() * 50 - 25],
              combined: [Math.random() * 50 - 25, Math.random() * 50 - 25]
            }
          };
        });
        
        setDrinks(processedDrinks);
        setTastes(tastesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleDrinkSelect = (drink) => {
    setSelectedDrink([drink]);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // Reset selected drink when changing filters
    setSelectedDrink(null);
  };

  const handleEmbeddingTypeChange = (type) => {
    setEmbeddingType(type);
    // Reset selected drink when changing embedding type
    setSelectedDrink(null);
  };

  // Get unique categories from drinks
  const categories = [...new Set(drinks.map(drink => drink.category))].filter(Boolean);
  
  // Filter drinks based on active filter
  const filteredDrinks = activeFilter === 'all'
    ? drinks
    : drinks.filter(drink => drink.category === activeFilter);

  // Process drinks to use the selected embedding coordinates
  const processedDrinks = filteredDrinks.map(drink => {
    if (!drink.position) return drink;
    
    return {
      ...drink,
      x: drink.position[embeddingType]?.[0] || 0,
      y: drink.position[embeddingType]?.[1] || 0
    };
  });

  return (
    <div className="graph-container">
      <h2>Drink Flavor Network</h2>
      <p>Explore relationships between drinks based on their flavor profiles, ingredients, and visual appearance</p>
      
      <div className="controls">
        <div className="filters">
          <div className="filter-group">
            <label>Filter by Category:</label>
            <select 
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Color By:</label>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              className="filter-select"
            >
              <option value="cluster">Flavor Clusters</option>
              <option value="taste">Taste</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          <div className="filter-group embedding-selector">
            <label>Embedding Type:</label>
            <div className="embedding-buttons">
              <button 
                className={embeddingType === 'text' ? 'active' : ''} 
                onClick={() => handleEmbeddingTypeChange('text')}
              >
                Text
              </button>
              <button 
                className={embeddingType === 'image' ? 'active' : ''} 
                onClick={() => handleEmbeddingTypeChange('image')}
              >
                Image
              </button>
              <button 
                className={embeddingType === 'combined' ? 'active' : ''} 
                onClick={() => handleEmbeddingTypeChange('combined')}
              >
                Combined
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading visualization data...</span>
        </div>
      ) : (
        <div className="visualization-area">
          <div className="embedding-info">
            <h3>Current View: {embeddingType.charAt(0).toUpperCase() + embeddingType.slice(1)} Embedding</h3>
            <p>
              {embeddingType === 'text' && 'Grouping drinks based on recipe text and descriptions'}
              {embeddingType === 'image' && 'Grouping drinks based on visual appearance'}
              {embeddingType === 'combined' && 'Grouping drinks based on both text and visual features'}
            </p>
          </div>
          
          <HoneycombChart 
            data={processedDrinks}
            fullData={processedDrinks}
            onDrinkSelect={handleDrinkSelect}
            colorBy={colorBy}
            getClusterLabel={getClusterLabel}
            embeddingType={embeddingType}
          />
          
          {selectedDrink && (
            <div className="selected-drink-info">
              <h3>Selected Drink</h3>
              <DrinkInfo drinkData={selectedDrink} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
