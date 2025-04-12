// const BASE_URL = "http://89.169.174.146:8888";
//
// export async function getAllDrinks() {
//   const res = await fetch(`${BASE_URL}/drinks`, {
//     method: "GET",
//   });
//   return res.json();
// }
//
// export async function getDrinkByName(name) {
//   const res = await fetch(`${BASE_URL}/drinks`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ name }),
//   });
//   return res.json();
// }
//
// export async function findSimilar(prompt, n = 10) {
//   const res = await fetch(`${BASE_URL}/find_similar`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ prompt, n_results: n }),
//   });
//   return res.json();
// }


import * as d3 from 'd3';

const BASE_URL = "http://89.169.174.146:8888";

export async function getAllDrinks() {
  try {
    // Пробуем загрузить из CSV вместо API
    return await loadDrinksFromCSV();
  } catch (error) {
    console.error("Ошибка загрузки из CSV, пробуем API", error);
    // Запасной вариант с API
    const res = await fetch(`${BASE_URL}/drinks`, {
      method: "GET",
    });
    return res.json();
  }
}

export async function loadDrinksFromCSV() {
  return d3.csv("/data/drinks.csv")
    .then(data => {
      // Преобразуем строки в нужные типы данных
      return data.map(d => ({
        ...d,
        // Преобразование строковых массивов в JavaScript массивы
        taste: parseArrayField(d.taste),
        ingredients: parseArrayField(d.ingredients),
        steps: parseArrayField(d.steps),
        ingredients_no_units: parseArrayField(d.ingredients_no_units),
        // Преобразование числовых полей
        num_tastes: +d.num_tastes,
        tsne_x: +d.tsne_x,
        tsne_y: +d.tsne_y,
        cluster: +d.cluster
      }));
    });
}

// Вспомогательная функция для парсинга полей-массивов
function parseArrayField(field) {
  if (!field) return [];

  try {
    // Заменяем одинарные кавычки на двойные для корректного JSON-парсинга
    const cleanedStr = field.replace(/^\[|\]$/g, '')  // Убираем внешние скобки
      .split(',')                                     // Разбиваем на элементы
      .map(item => item.trim())                       // Убираем лишние пробелы
      .filter(item => item.length > 0)                // Убираем пустые элементы
      .map(item => item.replace(/^'|'$/g, ''))        // Убираем одинарные кавычки

    return cleanedStr;
  } catch (e) {
    console.error("Ошибка парсинга массива:", field, e);
    return [];
  }
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