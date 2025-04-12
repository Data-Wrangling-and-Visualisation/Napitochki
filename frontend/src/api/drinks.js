const BASE_URL = "http://89.169.174.146:8888";

// Helper function to convert taste case from UPPERCASE to Title Case
function convertTasteCase(taste) {
  return taste.charAt(0).toUpperCase() + taste.slice(1).toLowerCase();
}

export async function getAllDrinks() {
  const res = await fetch(`${BASE_URL}/drinks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  return res.json();
}

export async function getDrinkByName(name) {
  const res = await fetch(`${BASE_URL}/drinks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getDrinkByTastes(tastes) {
  // Convert all taste strings to Title Case
  const formattedTastes = tastes.map(taste => convertTasteCase(taste));
  
  const res = await fetch(`${BASE_URL}/drinks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taste: formattedTastes }),
  });
  return res.json();
}

export async function findSimilar(prompt, n = 10) {
  const res = await fetch(`${BASE_URL}/find_similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, n_results: n }),
  });
  return res.json();
}

export async function getAllTastes() {
  const res = await fetch(`${BASE_URL}/tastes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
