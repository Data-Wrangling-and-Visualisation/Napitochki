// src/utils/clusterDescriptions.js
export const clusterDescriptions = [
  { id: 0, description: 'Floral, Sweet, Sour' },
  { id: 1, description: 'Sweet, Sour, Spicy, Umami' },
  { id: 2, description: 'Bitter, Floral, Sweet, Sour' },
  { id: 3, description: 'Tart, Sweet, Sour' },
  { id: 4, description: 'Citrusy, Floral, Sour' },
  { id: 5, description: 'Floral, Sweet, Sour' },
  { id: 6, description: 'Sweet, Creamy, Sour, Umami' },
  { id: 7, description: 'Citrusy, Sour, Spicy, Sweet' }
];

export function getClusterLabel(clusterId) {
  const cluster = clusterDescriptions.find(c => c.id === Number(clusterId));
  return cluster ? `${clusterId}: ${cluster.description}` : `${clusterId}`;
}