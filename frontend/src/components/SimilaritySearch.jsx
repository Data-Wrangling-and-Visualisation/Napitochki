import React, { useState } from 'react';
import { findSimilar } from '../api/drinks';
import DrinkInfo from './DrinkInfo';

export default function SimilaritySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [numResults, setNumResults] = useState(5);
  const [results, setResults] = useState([]);
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
    setSelectedDrink([drink.document]); // Wrap in array for DrinkInfo
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
      ) : results.matches && results.matches.length > 0 ? (
        <div className="search-results">
          <h3>Search Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Drink</th>
                <th>Similarity</th>
              </tr>
            </thead>
            <tbody>
              {results.matches.map((result) => (
                <tr 
                  key={result.document.name} 
                  onClick={() => handleSelectDrink(result)}
                  className="result-row"
                >
                  <td>{result.document.name}</td>
                  <td>
                    {(1 - result.distance).toFixed(2)}
                    <div 
                      className="similarity-bar" 
                      style={{ width: `${(1 - result.distance) * 100}%` }}
                    ></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        results.matches && <p>No drinks found for your search criteria.</p>
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