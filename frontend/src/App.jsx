import React from 'react';
import DrinksVisualization from './components/DrinkVisualization';
import './App.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Napitochki</h1>
        <p>Visualizing drinks information</p>
      </header>

      <main>
        <DrinksVisualization />
      </main>

      <footer>
        <p>© 2025 Napitochki</p>
      </footer>
    </div>
  );
}

export default App;