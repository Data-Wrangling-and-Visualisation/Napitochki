// src/App.jsx
import React, { useState } from 'react';
import Graph from './components/Graph';
import FlavorExplorer from './components/FlavorExplorer';
import SimilaritySearch from './components/SimilaritySearch';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('graph');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Napitochki - Drink Flavor Explorer</h1>
        <nav className="nav-tabs">
          <button 
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Flavor Graph
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
        <p>Napitochki - Drink visualization application</p>
      </footer>
    </div>
  );
}

export default App;
