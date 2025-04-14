import React, { useState, useEffect } from 'react';
import { getAllTastes, getDrinkByTastes } from '../api/drinks';
import DrinkInfo from './DrinkInfo';
import './FlavorExplorer.css'; // Добавим отдельный CSS файл

// Helper function to convert a taste to title case for display
function formatTasteForDisplay(taste) {
  return taste.charAt(0).toUpperCase() + taste.slice(1).toLowerCase();
}

export default function FlavorExplorer() {
  const [tastes, setTastes] = useState([]);
  const [selectedTastes, setSelectedTastes] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedDrink, setSelectedDrink] = useState(null);

  // Separate loading states
  const [tastesLoading, setTastesLoading] = useState(true);
  const [drinksLoading, setDrinksLoading] = useState(false);

  useEffect(() => {
    async function fetchTastes() {
      try {
        const tasteData = await getAllTastes();
        setTastes(tasteData);
        setTastesLoading(false);
      } catch (error) {
        console.error('Error fetching tastes:', error);
        setTastesLoading(false);
      }
    }

    fetchTastes();
  }, []);

  useEffect(() => {
    // Reset selected drink when filters change
    setSelectedDrink(null);

    if (selectedTastes.length > 0) {
      fetchDrinksByTastes();
    } else {
      setDrinks([]);
    }
  }, [selectedTastes]);

  const fetchDrinksByTastes = async () => {
    try {
      setDrinksLoading(true);
      const drinkData = await getDrinkByTastes(selectedTastes);
      setDrinks(drinkData);
      setDrinksLoading(false);
    } catch (error) {
      console.error('Error fetching drinks by tastes:', error);
      setDrinks([]);
      setDrinksLoading(false);
    }
  };

  const handleTasteToggle = (taste) => {
    setSelectedTastes(prev =>
      prev.includes(taste)
        ? prev.filter(t => t !== taste)
        : [...prev, taste]
    );
  };

  const handleDrinkSelect = (drink) => {
    setSelectedDrink([drink]); // Wrap in array to match DrinkInfo component expectation
  };

  return (
    <div className="flavor-explorer">
      <div className="taste-filter">
        <h2>Filter by Flavors</h2>
        <div className="taste-buttons">
          {tastesLoading ? <p>Loading tastes...</p> : (
            tastes.map(taste => (
              <button
                key={taste}
                onClick={() => handleTasteToggle(taste)}
                className={selectedTastes.includes(taste) ? 'selected' : ''}
              >
                {formatTasteForDisplay(taste)}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Новый контейнер для двухколоночной компоновки */}
      <div className="explorer-content">
        {selectedDrink && (
          <div className="drink-details-column">
            <h2>Drink Details</h2>
            <DrinkInfo drinkData={selectedDrink} />
          </div>
        )}

        <div className="drinks-list-column">
          <h2>Drinks with Selected Flavors</h2>
          {drinksLoading ? (
            <p>Loading drinks...</p>
          ) : drinks.length > 0 ? (
            <ul className="drinks-grid">
              {drinks.map(drink => (
                <li
                  key={drink.name}
                  onClick={() => handleDrinkSelect(drink)}
                  className={selectedDrink && selectedDrink[0]?.name === drink.name ? 'active' : ''}
                >
                  {drink.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>{selectedTastes.length > 0 ? 'No drinks found with these flavors.' : 'Select flavors to see drinks.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}