// src/App.jsx
import React, { useState } from 'react';
import Graph from './components/Graph';
import FlavorExplorer from './components/FlavorExplorer';
import SimilaritySearch from './components/SimilaritySearch';
import './App.css';
import './components/DrinkInfo.css';  // Import the new CSS

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
        </nav>
      </header>

      <main className="app-content">
        {activeTab === 'graph' && <Graph />}
        {activeTab === 'explorer' && <FlavorExplorer />}
        {activeTab === 'search' && <SimilaritySearch />}
      </main>

      <footer className="app-footer">
        <p>Three Bibkas @</p>
      </footer>
    </div>
  );
}

export default App;
