// src/utils/clusterDescriptions.js
export const clusterDescriptions = {
  0: { name: "Цветочно-сладкий", tastes: ["Floral", "Sweet", "Sour"] },
  1: { name: "Сладко-кислый с пряностями", tastes: ["Sweet", "Sour", "Spicy", "Umami"] },
  2: { name: "Горько-цветочный", tastes: ["Bitter", "Floral", "Sweet", "Sour"] },
  3: { name: "Терпко-сладкий", tastes: ["Tart", "Sweet", "Sour"] },
  4: { name: "Цитрусово-цветочный", tastes: ["Citrusy", "Floral", "Sour"] },
  5: { name: "Ярко-цветочный", tastes: ["Floral", "Sweet", "Sour"] },
  6: { name: "Сладко-кремовый", tastes: ["Sweet", "Creamy", "Sour", "Umami"] },
  7: { name: "Цитрусово-пряный", tastes: ["Citrusy", "Sour", "Spicy", "Sweet"] }
};

export const getClusterLabel = (clusterId) => {
  return clusterDescriptions[clusterId]
    ? `Кластер ${clusterId}: ${clusterDescriptions[clusterId].name}`
    : `Кластер ${clusterId}`;
};
