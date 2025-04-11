// src/components/DrinkInfo.jsx
import React from 'react';

function DrinkInfo({ drinkData }) {
  console.log(drinkData)
  drinkData = drinkData[0]
  return (
    <div>
      <h2>{drinkData.name}</h2>
      <p>{drinkData.description}</p>
      <p>Recipe: {drinkData.recipie}</p>
      <img src={drinkData.image_url} alt={drinkData.name} width="300" />
    </div>
  );
}

export default DrinkInfo;
