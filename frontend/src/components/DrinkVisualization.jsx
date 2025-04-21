// src/components/DrinksVisualization.jsx
import React, { useState, useEffect } from 'react';
import { getAllDrinks } from '../api/drinks.js';
import ScatterPlot from './visualizations/ScatterPlot';
// import NetworkGraph from './visualizations/NetworkGraph';
import HoneycombChart from './visualizations/HoneycombChart';
import './DrinksVisualization.css';

const DrinksVisualization = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [activeChart, setActiveChart] = useState('honeycomb');
  const [colorBy, setColorBy] = useState('cluster'); // Новый state

  useEffect(() => {
  const fetchDrinks = async () => {
    try {
      const data = await getAllDrinks();
      setDrinks(data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
      console.error('Ошибка загрузки данных:', err);
    }
  };

    fetchDrinks();
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleDrinkSelect = (drink) => {
    setSelectedDrink(drink);
  };

  const changeChart = (chartType) => {
    setActiveChart(chartType);
  };

  if (loading) return <div className="loading">Загрузка данных...</div>;
  if (error) return <div className="error">{error}</div>;

  const categories = [...new Set(drinks.map(drink => drink.category))];
  const filteredDrinks = activeFilter === 'all'
    ? drinks
    : drinks.filter(drink => drink.category === activeFilter);

  return (
    <div className="visualization-container">
      <div className="controls">
        <div className="chart-selector">
          <button
              className={activeChart === 'honeycomb' ? 'active' : ''}
              onClick={() => changeChart('honeycomb')}
          >
            Honeycomb Chart
          </button>
          <button
              className={activeChart === 'scatter' ? 'active' : ''}
              onClick={() => changeChart('scatter')}
          >
            Scatter Plot (t-SNE)
          </button>
          <button
              className={activeChart === 'network' ? 'active' : ''}
              onClick={() => changeChart('network')}
          >
            Network Graph
          </button>
        </div>

        <div className="filters">
          <span>Фильтр по категории: </span>
          <select
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Новый селектор для выбора цветовой схемы */}
          <span style={{ marginLeft: '20px' }}>Цвет по: </span>
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value)}
          >
            <option value="cluster">Кластерам</option>
            <option value="category">Категориям</option>
            <option value="taste">Вкусам (топ-1)</option>
          </select>
        </div>
      </div>

      <div className="chart-container">
        {activeChart === 'scatter' && (
          <ScatterPlot
            data={filteredDrinks}
            onDrinkSelect={handleDrinkSelect}
            selectedDrink={selectedDrink}
            colorBy={colorBy}
          />
        )}
        {/*{activeChart === 'network' && (
          <NetworkGraph
            data={filteredDrinks}
            onDrinkSelect={handleDrinkSelect}
            colorBy={colorBy}
          />
        )}*/}
        {/*{activeChart === 'honeycomb' && (*/}
        {/*  <HoneycombChart*/}
        {/*    data={filteredDrinks}*/}
        {/*    onDrinkSelect={handleDrinkSelect}*/}
        {/*    colorBy={colorBy}*/}
        {/*  />*/}
        {/*)}*/}
        {activeChart === 'honeycomb' && (
          <HoneycombChart
            data={filteredDrinks}
            fullData={drinks}
            onDrinkSelect={handleDrinkSelect}
            colorBy={colorBy}
          />
        )}
      </div>

      {selectedDrink && (
        <div className="drink-details">
          <h3>{selectedDrink.name}</h3>
          <p><strong>Category:</strong> {selectedDrink.category}</p>
          <p><strong>Taste:</strong> {selectedDrink.taste.join(', ')}</p>
          <h4>Ingredients:</h4>
          <ul>
            {selectedDrink.ingredients.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>
          <h4>Serving:</h4>
          <ol>
            {selectedDrink.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default DrinksVisualization;