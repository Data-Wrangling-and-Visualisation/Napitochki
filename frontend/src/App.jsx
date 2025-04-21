// src/App.jsx
import React, { useState } from 'react';
import Graph from './components/Graph';
import FlavorExplorer from './components/FlavorExplorer';
import SimilaritySearch from './components/SimilaritySearch';
import IngredientGraph from './components/IngredientGraph'; // Импорт нового компонента
import './App.css';
import './components/DrinkInfo.css';

function App() {
  const [activeTab, setActiveTab] = useState('graph');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Napitochki</h1>
        <h3>Drink Flavor Explorer</h3>
        <nav className="nav-tabs">
          <button
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Flavor Map
          </button>
          <button
            className={`tab-button ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            Flavor Explorer
          </button>
          <button
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Similarity Search
          </button>
          <button
            className={`tab-button ${activeTab === 'ingredient-graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredient-graph')}
          >
            Ingredients Co-occurrence
          </button>
        </nav>
      </header>

      <main className="app-content">
        {activeTab === 'graph' && <Graph/>}
        {activeTab === 'explorer' && <FlavorExplorer/>}
        {activeTab === 'search' && <SimilaritySearch/>}
        {activeTab === 'ingredient-graph' && <IngredientGraph/>}
        <footer className="app-footer">
          <p>Three Bibas @</p>
        </footer>
      </main>
    </div>
  );
}

export default App;