// src/components/DrinkList.jsx
import React, { useState, useEffect } from 'react';
import DrinkInfo from './DrinkInfo';

function DrinkList() {
  const [selectedDrink, setSelectedDrink] = useState(null);

  useEffect(() => {
    async function fetchDrinkByName() {
      try {
        fetch('http://89.169.174.146:8888/drinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: "Very Cherry Mojito" })
        })
        .then(response => {
          if (response.ok) {
              return response.json();  
          } else {
              throw new Error('Request failed with status code ' + response.status);
          }
      })
      .then(data => {
          console.log('Request was successful!');
          console.log('Response:', data);
          setSelectedDrink(data);
      })

        // const data = await response.json();
        // console.log('Fetched drink:', data);
        // setSelectedDrink(data);
      } catch (error) {
        console.error('Error fetching drink by name:', error);
      }
    }

    fetchDrinkByName();
  }, []);

  return (
    <div>
      <h1>Drink Info</h1>
      {selectedDrink ? (
        <DrinkInfo drinkData={selectedDrink} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default DrinkList;
