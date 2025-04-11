// src/components/Sidebar.jsx
export default function Sidebar({ drink }) {
    return (
      <div className="sidebar">
        {drink ? (
          <>
            <h2>{drink.id}</h2>
            <p><strong>Taste:</strong> {drink.taste}</p>
            <p><strong>Type:</strong> {drink.type}</p>
          </>
        ) : (
          <p>Select a drink to see details.</p>
        )}
      </div>
    );
  }
  