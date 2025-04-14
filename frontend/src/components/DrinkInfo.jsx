import React, { useState, useEffect } from 'react';

export default function DrinkInfo({ drinkData }) {
  const [imageLoading, setImageLoading] = useState(true);
  
  // Reset image loading state when drink changes
  useEffect(() => {
    setImageLoading(true);
    // Log the drink data for debugging
    if (drinkData && drinkData.length > 0) {
      console.log("Drink data:", drinkData[0]);
    }
  }, [drinkData]);
  
  if (!drinkData || drinkData.length === 0) {
    return <p>No drink selected</p>;
  }
  
  const drink = drinkData[0];
  
  // Handle image load completion
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Extract ingredients from the recipe array
  // Typically, ingredients are listed before preparation steps
  const extractIngredients = (recipeArray) => {
    if (!Array.isArray(recipeArray)) return [];
    
    // Look for steps that start with words like "Fill", "Add", "Pour", etc.
    const instructionKeywords = ["fill", "add", "pour", "stir", "mix", "blend", "garnish", "shake"];
    
    return recipeArray.filter(item => 
      !instructionKeywords.some(keyword => 
        item.toLowerCase().startsWith(keyword)
      )
    );
  };

  // Use the correct field name "recipie" instead of "recipe"
  const recipeSteps = drink.recipie || drink.recipe;
  const ingredients = extractIngredients(recipeSteps);
  const instructions = Array.isArray(recipeSteps) ? 
    recipeSteps.filter(step => !ingredients.includes(step)) : 
    [];

  return (
      <div className="drink-info">
        <h3>{drink.name}</h3>
        <div className="drink-image-and-tastes">
          <div className="drink-image-container">
            {imageLoading && (
                <div className="image-loader">
                  <div className="spinner"></div>
                </div>
            )}

            {drink.image_url && (
                <img
                    src={drink.image_url}
                    alt={drink.name}
                    className={`drink-image ${imageLoading ? 'loading' : 'loaded'}`}
                    onLoad={handleImageLoad}
                />
            )}
          </div>

          {drink.taste && drink.taste.length > 0 && (
              <div className="drink-tastes">
                <h4>Flavor Profile</h4>
                <div className="taste-tags">
                  {drink.taste.map(taste => (
                      <span key={taste} className="taste-tag">{taste}</span>
                  ))}
                </div>
              </div>
          )}
        </div>

          {ingredients && ingredients.length > 0 && (
              <div className="drink-ingredients">
                <h4>Ingredients</h4>
                <ul>
                  {ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
          )}

          {instructions && instructions.length > 0 && (
              <div className="drink-recipe">
                <h4>Instructions</h4>
                <ol className="recipe-steps">
                  {instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
          )}

          {drink.drink_url && (
              <div className="drink-link">
                <a href={drink.drink_url} target="_blank" rel="noopener noreferrer">
                  View Original Recipe
                </a>
              </div>
          )}
        </div>
        );
        }