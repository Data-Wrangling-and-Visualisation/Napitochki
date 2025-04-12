import React, { useState, useMemo } from 'react';
import { findSimilar } from '../api/drinks';
import DrinkInfo from './DrinkInfo';

export default function SimilaritySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [numResults, setNumResults] = useState(5);
  const [results, setResults] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Reset selected drink when performing a new search
    setSelectedDrink(null);
    
    setLoading(true);
    try {
      const data = await findSimilar(searchTerm, numResults);
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error searching for similar drinks:', error);
      setLoading(false);
    }
  };

  const handleSelectDrink = (drink) => {
    setSelectedDrink([drink]); // Wrap in array for DrinkInfo
  };

  // Find the maximum distance in the current results set
  const maxDistance = useMemo(() => {
    if (!results || !results.distances || results.distances.length === 0) {
      return 1; // Default value if no distances
    }
    return Math.max(...results.distances);
  }, [results]);

  // Calculate bar width for distance visualization
  // Smaller distances = more similar = longer bars
  const calculateBarWidth = (distance) => {
    if (maxDistance === 0) return 95; // Avoid division by zero
    
    // Smaller distances get longer bars
    const normalizedValue = 1 - (distance / maxDistance);
    return Math.min(95, Math.max(5, normalizedValue * 100));
  };

  // Format the distance for display
  const formatDistance = (distance) => {
    // For very small distances, show scientific notation
    if (distance < 0.001) {
      return distance.toExponential(2);
    }
    
    // For larger distances, show fixed decimal
    return distance.toFixed(4);
  };

  return (
    <div className="similarity-search">
      <h2>Find Similar Drinks</h2>
      <p>Describe the flavor profile you're looking for</p>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-inputs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g., sweet berry drink"
            className="search-input"
          />
          <select
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value))}
            className="results-select"
          >
            {[3, 5, 10, 15, 20].map(num => (
              <option key={num} value={num}>{num} results</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading ? (
        <div className="loading-results">Searching for drinks...</div>
      ) : results && results.drinks && results.drinks.length > 0 ? (
        <div className="search-results">
          <h3>Search Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Drink</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {results.drinks.map((drink, index) => (
                <tr 
                  key={drink.name} 
                  onClick={() => handleSelectDrink(drink)}
                  className="result-row"
                >
                  <td>{drink.name}</td>
                  <td>
                    {formatDistance(results.distances[index])}
                    <div 
                      className="similarity-bar" 
                      style={{ width: `${calculateBarWidth(results.distances[index])}%` }}
                    ></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        results && <p>No drinks found for your search criteria.</p>
      )}

      {selectedDrink && (
        <div className="selected-result">
          <h3>Drink Details</h3>
          <DrinkInfo drinkData={selectedDrink} />
        </div>
      )}
    </div>
  );
}