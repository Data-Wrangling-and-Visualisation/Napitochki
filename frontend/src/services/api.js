const API_BASE_URL = 'http://89.169.174.146:8888';

export const fetchAllDrinks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/drinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching all drinks:', error);
    return [];
  }
};

export const fetchDrinksByTaste = async (tastes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/drinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taste: tastes }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching drinks by taste:', error);
    return [];
  }
};

export const fetchSimilarDrinks = async (prompt, n_results = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/find_similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, n_results }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching similar drinks:', error);
    return { documents: [], distances: [] };
  }
};

export const fetchAllTastes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tastes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching all tastes:', error);
    return [];
  }
};