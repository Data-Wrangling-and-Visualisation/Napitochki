const BASE_URL = "http://89.169.174.146:8888";

export async function getAllDrinks() {
  const res = await fetch(`${BASE_URL}/drinks`, {
    method: "GET",
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

export async function findSimilar(prompt, n = 10) {
  const res = await fetch(`${BASE_URL}/find_similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, n_results: n }),
  });
  return res.json();
}
