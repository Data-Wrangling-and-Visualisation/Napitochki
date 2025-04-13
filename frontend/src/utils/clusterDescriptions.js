export const clusterDescriptions = {
  0: { name: "Floral-Sweet", tastes: ["Floral", "Sweet", "Sour"] },
  1: { name: "Sweet-Sour with Spices", tastes: ["Sweet", "Sour", "Spicy", "Umami"] },
  2: { name: "Bitter-Floral", tastes: ["Bitter", "Floral", "Sweet", "Sour"] },
  3: { name: "Tart-Sweet", tastes: ["Tart", "Sweet", "Sour"] },
  4: { name: "Citrus-Floral", tastes: ["Citrusy", "Floral", "Sour"] },
  5: { name: "Vibrant Floral", tastes: ["Floral", "Sweet", "Sour"] },
  6: { name: "Sweet-Creamy", tastes: ["Sweet", "Creamy", "Sour", "Umami"] },
  7: { name: "Citrus-Spicy", tastes: ["Citrusy", "Sour", "Spicy", "Sweet"] }
};

export const getClusterLabel = (clusterId) => {
  return clusterDescriptions[clusterId]?.name || `Cluster ${clusterId}`;
};